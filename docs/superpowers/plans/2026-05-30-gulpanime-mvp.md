# GulpAnime MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build MVP of anime catalog site with PWA/offline support

**Architecture:** Hybrid MPA + JS enhancements. Gulp builds HTML pages from includes, SCSS → CSS, JS bundles. PWA via pwa.core.js. Kodik API through Hono proxy (separate repo, git submodule).

**Tech Stack:** Vanilla JS, Gulp, SCSS, PWA Core, HLS.js

---

## File Structure

### Files to create:
- `package.json` — project dependencies
- `gulpfile.js` — build tasks
- `.gitignore` — ignore dist/, node_modules/
- `.gitmodules` — Hono proxy submodule
- `src/manifest.json` — PWA manifest
- `src/includes/header.html` — shared header
- `src/includes/footer.html` — shared footer
- `src/pages/index.html` — homepage
- `src/pages/catalog.html` — catalog page
- `src/pages/anime.html` — anime detail page
- `src/assets/styles/_variables.scss` — CSS variables
- `src/assets/styles/_reset.scss` — CSS reset
- `src/assets/styles/_theme.scss` — auto theme
- `src/assets/styles/_layout.scss` — grid, cards, layout
- `src/assets/styles/_components.scss` — UI components
- `src/assets/styles/main.scss` — imports all partials
- `src/assets/scripts/utils.js` — helpers
- `src/assets/scripts/api.js` — Hono proxy client
- `src/assets/scripts/theme.js` — theme toggle
- `src/assets/scripts/search.js` — search/filter
- `src/assets/scripts/router.js` — pjax navigation
- `src/assets/scripts/app.js` — entry point
- `src/sw/pwa.core.js` — downloaded from AN0NCER/pwa.core.js
- `src/sw/worker.js` — adapted from AN0NCER/pwa.core.js

---

### Task 1: Init project

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "gulpanime",
  "version": "0.1.0",
  "private": true,
  "description": "Anime catalog site with PWA",
  "scripts": {
    "build": "gulp build",
    "dev": "gulp watch",
    "data": "gulp data"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@babel/preset-env": "^7.24.0",
    "browser-sync": "^3.0.0",
    "gulp": "^5.0.0",
    "gulp-autoprefixer": "^9.0.0",
    "gulp-babel": "^8.0.0",
    "gulp-clean-css": "^4.3.0",
    "gulp-concat": "^2.6.1",
    "gulp-file-include": "^2.3.0",
    "gulp-htmlmin": "^5.0.1",
    "gulp-sass": "^5.1.0",
    "gulp-uglify": "^3.0.2",
    "sass": "^1.77.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 3: Init git repo and install deps**

Run:
```bash
git init
npm install
```

Expected: `node_modules/` created, all packages installed

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: init project"
```

---

### Task 2: Setup PWA Core files

**Files:**
- Create: `src/sw/pwa.core.js`
- Create: `src/sw/worker.js`
- Create: `src/manifest.json`

- [ ] **Step 1: Create manifest.json**

`src/manifest.json`:
```json
{
  "name": "GulpAnime",
  "short_name": "GA",
  "description": "Anime catalog with offline support",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0d0d",
  "theme_color": "#1a1a2e",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Download pwa.core.js from AN0NCER/pwa.core.js**

Run:
```bash
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/AN0NCER/pwa.core.js/main/library/pwa.core.js" -OutFile "src/sw/pwa.core.js"
```

Expected: File created at `src/sw/pwa.core.js`

- [ ] **Step 3: Create worker.js**

`src/sw/worker.js`:
```javascript
const version = '0.1.0';
const hash = 'gulpanime';

const cacheName = `pwa-sw-${hash}-v${version}`;

const appShellFilesToCache = [
  '/',
  '/index.html',
  '/catalog.html',
  '/anime.html',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/manifest.json'
];

const log = console.log.bind(console, `[${version}]:[${hash}] ->`);
const err = console.error.bind(console, `[${version}]:[${hash}] ->`);
const warn = console.warn.bind(console, `[${version}]:[${hash}] ->`);

const worker = self;

const setup = {
  defaults: {
    install: {
      channel: 'sw-update',
      activate: true,
      install: true,
      batchSize: 2
    }
  },
  cache: {
    val: null,
    req: 'settings',
    key: 'pwa-settings',
    get: async function () {
      if (this.val) return this.val;
      try {
        const cache = await caches.open(this.key);
        const response = await cache.match(this.req);
        if (response) {
          this.val = await response.json();
          return this.val;
        }
        return null;
      } catch (error) {
        err('error get settings:', error);
        return null;
      }
    },
    set: async function (value) {
      try {
        const cache = await caches.open(this.key);
        const response = new Response(JSON.stringify(value));
        await cache.put(this.req, response);
        this.val = value;
        return true;
      } catch (error) {
        err('error set settings:', error);
        return false;
      }
    },
    clear: async function () {
      try {
        const cache = await caches.open(this.key);
        await cache.delete(this.req);
        this.val = null;
        return true;
      } catch (error) {
        err('error clear settings:', error);
        return false;
      }
    }
  },
  getValue: async function (key, customDefault = null) {
    const all = await this.cache.get();
    const storedValue = all && all.hasOwnProperty(key) ? all[key] : null;
    const defaultValue = customDefault !== null ? customDefault : this.defaults[key] || null;
    if (storedValue === null) return defaultValue;
    return storedValue;
  },
  getAll: async function () {
    const stored = await this.cache.get() || {};
    const result = {};
    for (const key in this.defaults) result[key] = await this.getValue(key);
    for (const key in stored) { if (!this.defaults.hasOwnProperty(key)) result[key] = stored[key]; }
    return result;
  },
  getDefaults: function () { return { ...this.defaults }; },
  setValue: async function (key, value) {
    const current = await this.cache.get() || {};
    current[key] = value;
    return await this.cache.set(current);
  },
  update: async function (updates) {
    const current = await this.cache.get() || {};
    const merge = (target, source) => {
      return Object.keys(source).reduce((result, key) => {
        result[key] = source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          ? merge(target[key] || {}, source[key])
          : source[key];
        return result;
      }, { ...target });
    };
    return await this.cache.set(merge(current, updates));
  },
  reset: async function () {
    await this.cache.set(this.defaults);
    return await this.getAll();
  }
};

worker.addEventListener('install', (event) => {
  event.waitUntil(
    setup.getValue('install').then(async (s) => {
      const broadcast = new BroadcastChannel(s.channel);
      await caching(appShellFilesToCache, s);
      if (s.activate) worker.skipWaiting();
    })
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await worker.clients.claim();
    const names = await caches.keys();
    await Promise.all(
      names.map(name => {
        if (name !== cacheName && name !== setup.cache.key) return caches.delete(name);
      })
    );
    log('worker activated.');
  })());
});

async function caching(filesToCache, { channel, batchSize }) {
  const broadcast = new BroadcastChannel(channel);
  try {
    const cache = await caches.open(cacheName);
    const total = filesToCache.length;
    let processed = 0;
    if (total === 0) { warn('no files to cache.'); return; }
    log(`caching ${total} files.`);
    const batch = async (files) => {
      const batchPromises = files.map(async (file) => {
        let success = true;
        try { await cache.add(file); } catch (error) { success = false; err(`!failed to cache ${file}`, error); }
        processed++;
        broadcast.postMessage({ type: 'CACHE_PROGRESS', payload: { total, processed, percent: ((processed / total) * 100).toFixed(2), file, success } });
        return { file, success };
      });
      await Promise.allSettled(batchPromises);
    };
    for (let i = 0; i < total; i += batchSize) {
      const batchFiles = filesToCache.slice(i, i + batchSize);
      await batch(batchFiles);
    }
    log(`caching complete!`);
    broadcast.postMessage({ type: 'CACHE_COMPLETE', payload: { version, cacheName } });
  } catch (error) {
    err('!failed start caching!:', error);
    broadcast.postMessage({ type: 'CACHE_ERROR', payload: { error: error.message } });
  }
}

worker.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const url = new URL(event.request.url);
    try {
      if (worker.location.hostname !== url.hostname) return fetch(event.request);
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (url.pathname === "/") return (await caches.match('/index.html')) || fetch(event.request);
      return (await caches.match(url.pathname)) || fetch(event.request);
    } catch (e) {
      warn(`fetch error ${e}`);
      return fetch(event.request);
    }
  })());
});

(() => {
  const methods = {
    'ACTIVATE': () => { worker.skipWaiting(); return { complete: true }; },
    'META': async () => {
      const source = await setup.getValue('source', 'worker');
      return { version, hash, source };
    }
  };
  worker.addEventListener('message', async ({ source: client, data }) => {
    const { type, payload } = data;
    if (!methods[type]) return client.postMessage(JSON.stringify({ type }));
    const value = await methods[type](payload);
    client.postMessage(JSON.stringify({ type, payload: value }));
  });
})(log('message system ready'));
```

- [ ] **Step 4: Commit**

```bash
git add src/sw/ src/manifest.json
git commit -m "feat: add PWA Core files and manifest"
```

---

### Task 3: Create CSS theme system

**Files:**
- Create: `src/assets/styles/_variables.scss`
- Create: `src/assets/styles/_reset.scss`
- Create: `src/assets/styles/_theme.scss`
- Create: `src/assets/styles/_layout.scss`
- Create: `src/assets/styles/_components.scss`
- Create: `src/assets/styles/main.scss`

- [ ] **Step 1: Create _variables.scss**

`src/assets/styles/_variables.scss`:
```scss
:root {
  // Spacing
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  // Typography
  --font-family: system-ui, -apple-system, sans-serif;
  --font-size-sm: 0.85rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  // Borders
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  // Transitions
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;

  // Layout
  --max-width: 1200px;
  --header-height: 60px;
  --card-min-width: 160px;
}
```

- [ ] **Step 2: Create _reset.scss**

`src/assets/styles/_reset.scss`:
```scss
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family);
  line-height: 1.5;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

input {
  font: inherit;
  border: none;
  outline: none;
}

ul, ol {
  list-style: none;
}
```

- [ ] **Step 3: Create _theme.scss**

`src/assets/styles/_theme.scss`:
```scss
:root {
  // Dark theme (default)
  --bg: #0d0d0d;
  --bg-surface: #1a1a2e;
  --bg-elevated: #222240;
  --bg-hover: #2a2a4a;
  --text: #e8e8e8;
  --text-secondary: #9a9ab0;
  --text-tertiary: #6a6a80;
  --border: #2a2a40;
  --accent: #4a8eff;
  --accent-hover: #6aa0ff;
  --shadow: rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #f5f5f7;
    --bg-surface: #ffffff;
    --bg-elevated: #f0f0f2;
    --bg-hover: #e8e8ec;
    --text: #1d1d1f;
    --text-secondary: #86868b;
    --text-tertiary: #aeaeb2;
    --border: #d1d1d6;
    --accent: #0071e3;
    --accent-hover: #0077ed;
    --shadow: rgba(0, 0, 0, 0.08);
  }
}
```

- [ ] **Step 4: Create _layout.scss**

`src/assets/styles/_layout.scss`:
```scss
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
}

.header-logo {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--accent);
}

.header-search {
  flex: 1;
  max-width: 400px;
  margin: 0 var(--space-lg);
}

.footer {
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--border);
  margin-top: var(--space-xl);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
  gap: var(--space-md);
  padding: var(--space-md) 0;
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: var(--space-lg) 0 var(--space-md);
}

.page {
  padding: var(--space-lg) 0;
  min-height: calc(100vh - var(--header-height) - 80px);
}
```

- [ ] **Step 5: Create _components.scss**

`src/assets/styles/_components.scss`:
```scss
// Anime card
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px var(--shadow);
  }
}

.card-poster {
  aspect-ratio: 3/4;
  background: var(--bg-elevated);
  object-fit: cover;
  width: 100%;
}

.card-body {
  padding: var(--space-sm) var(--space-md);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

// Search input
.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

// Filters
.filters {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}

.filter-select {
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

// Button
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--accent);
  color: #fff;

  &:hover {
    background: var(--accent-hover);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);

  &:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
}

// Load more
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--space-lg);
}

// Empty state
.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

// Skeleton loader
.skeleton {
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Detail page
.detail-header {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.detail-poster {
  width: 250px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.detail-info {
  flex: 1;
}

.detail-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.tag {
  padding: 2px 10px;
  background: var(--bg-elevated);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.detail-description {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-lg);
}
```

- [ ] **Step 6: Create main.scss**

`src/assets/styles/main.scss`:
```scss
@import 'variables';
@import 'reset';
@import 'theme';
@import 'layout';
@import 'components';
```

- [ ] **Step 7: Commit**

```bash
git add src/assets/styles/
git commit -m "feat: add SCSS theme system and component styles"
```

---

### Task 4: Create HTML includes and pages

**Files:**
- Create: `src/includes/header.html`
- Create: `src/includes/footer.html`
- Create: `src/pages/index.html`
- Create: `src/pages/catalog.html`
- Create: `src/pages/anime.html`

- [ ] **Step 1: Create header.html**

`src/includes/header.html`:
```html
<header class="header">
  <a href="/" class="header-logo">GulpAnime</a>
  <div class="header-search">
    <input type="search" class="search-input" id="searchInput" placeholder="Поиск аниме..." />
  </div>
  <nav>
    <a href="/catalog.html" class="btn btn-ghost">Каталог</a>
  </nav>
</header>
```

- [ ] **Step 2: Create footer.html**

`src/includes/footer.html`:
```html
<footer class="footer">
  <p>GulpAnime &mdash; аниме каталог с офлайн-доступом</p>
</footer>
```

- [ ] **Step 3: Create index.html**

`src/pages/index.html`:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1a1a2e" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="stylesheet" href="/assets/css/main.css" />
  <title>GulpAnime</title>
</head>
<body>
  @@include('../includes/header.html')

  <main class="page">
    <div class="container">
      <h2 class="section-title">Популярное</h2>
      <div class="card-grid" id="popularGrid">
        <!-- JS fills this -->
      </div>

      <h2 class="section-title">Недавно добавленные</h2>
      <div class="card-grid" id="recentGrid">
        <!-- JS fills this -->
      </div>
    </div>
  </main>

  @@include('../includes/footer.html')

  <script src="/assets/js/app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 4: Create catalog.html**

`src/pages/catalog.html`:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1a1a2e" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="stylesheet" href="/assets/css/main.css" />
  <title>Каталог — GulpAnime</title>
</head>
<body>
  @@include('../includes/header.html')

  <main class="page">
    <div class="container">
      <div class="filters" id="filters">
        <select class="filter-select" id="filterGenre">
          <option value="">Все жанры</option>
        </select>
        <select class="filter-select" id="filterYear">
          <option value="">Все года</option>
        </select>
        <select class="filter-select" id="filterStatus">
          <option value="">Любой статус</option>
          <option value="ongoing">Онгоинг</option>
          <option value="released">Вышел</option>
        </select>
      </div>

      <div class="card-grid" id="catalogGrid">
        <!-- JS fills this -->
      </div>

      <div class="load-more">
        <button class="btn btn-primary" id="loadMoreBtn">Загрузить ещё</button>
      </div>
    </div>
  </main>

  @@include('../includes/footer.html')

  <script src="/assets/js/app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 5: Create anime.html**

`src/pages/anime.html`:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1a1a2e" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="stylesheet" href="/assets/css/main.css" />
  <title>Аниме — GulpAnime</title>
</head>
<body>
  @@include('../includes/header.html')

  <main class="page">
    <div class="container">
      <div id="animeDetail">
        <!-- JS fills this -->
      </div>
    </div>
  </main>

  @@include('../includes/footer.html')

  <script src="/assets/js/app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/ src/includes/
git commit -m "feat: add HTML pages and includes"
```

---

### Task 5: Create Gulpfile

**Files:**
- Create: `gulpfile.js`

- [ ] **Step 1: Create gulpfile.js**

`gulpfile.js`:
```javascript
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const fileInclude = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();

const paths = {
  styles: {
    src: 'src/assets/styles/*.scss',
    dest: 'dist/assets/css'
  },
  scripts: {
    src: 'src/assets/scripts/**/*.js',
    dest: 'dist/assets/js'
  },
  html: {
    src: 'src/pages/*.html',
    dest: 'dist'
  },
  pwa: {
    src: 'src/sw/**/*',
    dest: 'dist'
  },
  manifest: {
    src: 'src/manifest.json',
    dest: 'dist'
  },
  assets: {
    src: 'src/assets/images/**/*',
    dest: 'dist/assets/images'
  },
  data: {
    src: 'src/data/**/*',
    dest: 'dist/data'
  }
};

function styles() {
  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

function html() {
  return gulp.src(paths.html.src)
    .pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(browserSync.stream());
}

function pwa() {
  return gulp.src(paths.pwa.src)
    .pipe(gulp.dest(paths.pwa.dest));
}

function manifest() {
  return gulp.src(paths.manifest.src)
    .pipe(gulp.dest(paths.manifest.dest));
}

function assets() {
  return gulp.src(paths.assets.src)
    .pipe(gulp.dest(paths.assets.dest));
}

function data() {
  return gulp.src(paths.data.src)
    .pipe(gulp.dest(paths.data.dest));
}

function watch() {
  browserSync.init({
    server: { baseDir: './dist' }
  });

  gulp.watch('src/assets/styles/**/*.scss', styles);
  gulp.watch('src/assets/scripts/**/*.js', scripts);
  gulp.watch('src/pages/**/*.html', html);
  gulp.watch('src/includes/**/*.html', html);
  gulp.watch('src/sw/**/*', pwa);
  gulp.watch('src/manifest.json', manifest);
}

const build = gulp.series(
  gulp.parallel(styles, scripts, html, pwa, manifest, assets, data)
);

module.exports = {
  styles,
  scripts,
  html,
  pwa,
  manifest,
  assets,
  data,
  watch,
  build
};
```

- [ ] **Step 2: Create src/data/ directory with placeholder**

Run:
```bash
New-Item -ItemType Directory -Path "src/data" -Force
```

Then create `src/data/.gitkeep` (empty file).

- [ ] **Step 3: Create src/assets/images/ directory**

Run:
```bash
New-Item -ItemType Directory -Path "src/assets/images" -Force
```

- [ ] **Step 4: Build project and verify**

Run:
```bash
npx gulp build
```

Expected: `dist/` created with compiled CSS, JS, HTML, SW, manifest

- [ ] **Step 5: Commit**

```bash
git add gulpfile.js src/data/ src/assets/images/
git commit -m "feat: add Gulpfile and build pipeline"
```

---

### Task 6: Create JS modules

**Files:**
- Create: `src/assets/scripts/utils.js`
- Create: `src/assets/scripts/api.js`
- Create: `src/assets/scripts/theme.js`
- Create: `src/assets/scripts/search.js`
- Create: `src/assets/scripts/router.js`
- Create: `src/assets/scripts/app.js`

- [ ] **Step 1: Create utils.js**

`src/assets/scripts/utils.js`:
```javascript
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function getFromStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function addToArrayStorage(key, item) {
  const arr = getFromStorage(key, []);
  if (!arr.find(i => i.id === item.id)) {
    arr.push(item);
    setToStorage(key, arr);
  }
  return arr;
}

export function removeFromArrayStorage(key, id) {
  const arr = getFromStorage(key, []);
  const filtered = arr.filter(i => i.id !== id);
  setToStorage(key, filtered);
  return filtered;
}

export function createCard(anime) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img class="card-poster" src="${anime.screenshots?.[0] || ''}" alt="${anime.title}" loading="lazy" onerror="this.style.display='none'" />
    <div class="card-body">
      <div class="card-title">${anime.title}</div>
      <div class="card-meta">${anime.year || ''}${anime.type ? ' • ' + anime.type : ''}</div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/anime.html?id=${anime.id}`;
  });
  return card;
}

export function renderCards(container, items) {
  container.innerHTML = '';
  items.forEach(item => container.appendChild(createCard(item)));
}

export function showLoader(container) {
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'card';
    skeleton.innerHTML = `
      <div class="card-poster skeleton"></div>
      <div class="card-body">
        <div class="skeleton" style="height:14px;width:70%;margin-bottom:4px"></div>
        <div class="skeleton" style="height:10px;width:40%"></div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}
```

- [ ] **Step 2: Create api.js**

`src/assets/scripts/api.js`:
```javascript
const PROXY_URL = '/api';

export async function fetchList(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${PROXY_URL}/list${query ? '?' + query : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

export async function searchAnime(query, params = {}) {
  const searchParams = new URLSearchParams({ q: query, ...params }).toString();
  const url = `${PROXY_URL}/search?${searchParams}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search error: ' + res.status);
  return res.json();
}

export async function getPlayer(id, translation, episode) {
  const params = new URLSearchParams({ id, translation, episode }).toString();
  const url = `${PROXY_URL}/player?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Player error: ' + res.status);
  return res.json();
}
```

- [ ] **Step 3: Create theme.js**

`src/assets/scripts/theme.js`:
```javascript
export function initTheme() {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) return;

  const updateThemeColor = () => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeColor.setAttribute('content', isDark ? '#1a1a2e' : '#ffffff');
  };

  updateThemeColor();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
}
```

- [ ] **Step 4: Create search.js**

`src/assets/scripts/search.js`:
```javascript
import { debounce, renderCards } from './utils.js';
import { searchAnime } from './api.js';

export function initSearch(inputId, gridId) {
  const input = document.getElementById(inputId);
  const grid = document.getElementById(gridId);
  if (!input || !grid) return;

  const doSearch = debounce(async (query) => {
    if (!query.trim()) return;
    try {
      const data = await searchAnime(query, { limit: 20 });
      renderCards(grid, data.results || []);
    } catch {
      grid.innerHTML = '<div class="empty-state">Не удалось загрузить результаты</div>';
    }
  }, 400);

  input.addEventListener('input', (e) => doSearch(e.target.value));
}
```

- [ ] **Step 5: Create router.js**

`src/assets/scripts/router.js`:
```javascript
export function initRouter() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    loadPage(window.location.pathname + window.location.search);
  });
}

export async function navigate(url) {
  history.pushState(null, '', url);
  await loadPage(url);
}

async function loadPage(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const main = document.querySelector('main');
    if (!main) { window.location.href = url; return; }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newMain = doc.querySelector('main');

    if (newMain) {
      main.innerHTML = newMain.innerHTML;
      document.title = doc.title;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    reinitPage();
  } catch {
    window.location.href = url;
  }
}

function reinitPage() {
  if (window.location.pathname.includes('catalog')) {
    import('./search.js').then(m => m.initSearch('searchInput', 'catalogGrid'));
  }
}
```

- [ ] **Step 6: Create app.js**

`src/assets/scripts/app.js`:
```javascript
import { initTheme } from './theme.js';
import { initRouter } from './router.js';
import { initSearch } from './search.js';
import { fetchList, getPlayer } from './api.js';
import { renderCards, showLoader, getFromStorage, addToArrayStorage, removeFromArrayStorage, createCard } from './utils.js';

const PWA = window.$PWA;

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const isCatalog = window.location.pathname.includes('catalog');
  const isAnime = window.location.pathname.includes('anime');
  const isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';

  if (isHome) {
    await loadHomePage();
  }

  if (isCatalog) {
    initSearch('searchInput', 'catalogGrid');
    await loadCatalog();
  }

  if (isAnime) {
    await loadAnimeDetail();
  }

  if (!isCatalog) {
    initRouter();
  }
});

async function loadHomePage() {
  const popularGrid = document.getElementById('popularGrid');
  const recentGrid = document.getElementById('recentGrid');

  showLoader(popularGrid);
  showLoader(recentGrid);

  try {
    const data = await fetchList({ limit: 12, sort: 'views', order: 'desc' });
    renderCards(popularGrid, data.results?.slice(0, 6) || []);
    renderCards(recentGrid, data.results?.slice(6, 12) || []);
  } catch {
    popularGrid.innerHTML = '<div class="empty-state">Не удалось загрузить данные</div>';
    recentGrid.innerHTML = '';
  }
}

async function loadCatalog() {
  const grid = document.getElementById('catalogGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  let page = 1;
  const limit = 20;
  let allResults = [];

  const fetchPage = async () => {
    showLoader(grid);
    try {
      const data = await fetchList({ limit, page, sort: 'year', order: 'desc' });
      allResults = [...allResults, ...(data.results || [])];
      renderCards(grid, allResults);
      if (data.results?.length < limit) {
        loadMoreBtn.style.display = 'none';
      }
    } catch {
      grid.innerHTML = '<div class="empty-state">Не удалось загрузить каталог</div>';
    }
  };

  await fetchPage();

  loadMoreBtn?.addEventListener('click', async () => {
    page++;
    await fetchPage();
  });
}

async function loadAnimeDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('animeDetail');
  if (!id || !container) return;

  try {
    const data = await fetchList({ id });
    const anime = data.results?.[0];
    if (!anime) { container.innerHTML = '<div class="empty-state">Аниме не найдено</div>'; return; }

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-poster">
          <img src="${anime.screenshots?.[0] || ''}" alt="${anime.title}" style="width:100%;border-radius:var(--radius-md)" onerror="this.style.display='none'" />
        </div>
        <div class="detail-info">
          <h1 class="detail-title">${anime.title}</h1>
          <div class="detail-meta">
            <span>${anime.year || ''}</span>
            ${anime.type ? '<span>' + anime.type + '</span>' : ''}
            ${anime.episodes_count ? '<span>' + anime.episodes_count + ' эп.</span>' : ''}
            ${anime.rating ? '<span>★ ' + anime.rating + '</span>' : ''}
          </div>
          <div class="detail-tags">
            ${(anime.genres || []).map(g => '<span class="tag">' + g + '</span>').join('')}
          </div>
          ${anime.description ? '<p class="detail-description">' + anime.description + '</p>' : ''}
          <button class="btn btn-primary" id="favBtn">
            ${getFromStorage('favorites', []).find(f => f.id === anime.id) ? '✓ В избранном' : '★ В избранное'}
          </button>
        </div>
      </div>
    `;

    const favBtn = document.getElementById('favBtn');
    favBtn?.addEventListener('click', () => {
      const favs = getFromStorage('favorites', []);
      const exists = favs.find(f => f.id === anime.id);
      if (exists) {
        removeFromArrayStorage('favorites', anime.id);
        favBtn.textContent = '★ В избранное';
      } else {
        addToArrayStorage('favorites', { id: anime.id, title: anime.title, year: anime.year, poster: anime.screenshots?.[0] });
        favBtn.textContent = '✓ В избранном';
      }
    });
  } catch {
    container.innerHTML = '<div class="empty-state">Не удалось загрузить информацию об аниме</div>';
  }
}
```

- [ ] **Step 7: Build and verify**

Run:
```bash
npx gulp build
```

Expected: `dist/assets/js/app.js` created, no errors

- [ ] **Step 8: Commit**

```bash
git add src/assets/scripts/
git commit -m "feat: add JS modules (api, theme, search, router, app)"
```

---

### Task 7: Add PWA registration and verify build

**Files:**
- Modify: `src/pages/index.html`
- Modify: `src/pages/catalog.html`
- Modify: `src/pages/anime.html`
- Modify: `gulpfile.js`

- [ ] **Step 1: Add pwa.core.js import to all HTML pages**

Add this after `<link rel="stylesheet">` in each page:
```html
<script src="/pwa.core.js" type="module"></script>
```

- [ ] **Step 2: Add pwa.core.js to gulp PWA task (already included via glob)**

The gulp PWA task already copies `src/sw/**/*` to `dist/`.

- [ ] **Step 3: Build full project**

Run:
```bash
npx gulp build
```

Expected: `dist/` has all files, including `dist/pwa.core.js`, `dist/worker.js`, `dist/manifest.json`

- [ ] **Step 4: Commit**

```bash
git add src/pages/ gulpfile.js
git commit -m "feat: add PWA registration to all pages"
```

---

### Task 8: Add proxy submodule reference

**Files:**
- Create: `.gitmodules`

- [ ] **Step 1: Create .gitmodules**

`.gitmodules`:
```
[submodule "proxy"]
  path = proxy
  url = https://github.com/YOUR_USER/YOUR_PROXY_REPO.git
```

- [ ] **Step 2: Commit**

```bash
git add .gitmodules
git commit -m "chore: add proxy submodule reference"
```

---

### Task 9: Final verification

- [ ] **Step 1: Clean build**

```bash
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npx gulp build
```

Expected: Clean build succeeds, `dist/` structure:
```
dist/
├── index.html
├── catalog.html
├── anime.html
├── manifest.json
├── pwa.core.js
├── worker.js
├── data/
│   └── .gitkeep
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── app.js
│   └── images/
```

- [ ] **Step 2: Verify PWA registration**

Open `dist/index.html` in browser, check console:
- `[pwa] -> module connected`
- Service Worker registered without errors

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final MVP build"
```
