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
