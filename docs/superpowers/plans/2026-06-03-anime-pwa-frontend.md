# Anime PWA Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the installable anime PWA (Vite + React + TS) hosted on GitHub Pages at `pyw0w.github.io`: Shikimori catalog/search, Shikimori OAuth + личные списки, and a custom hls.js player fed by the `anime-proxy` Worker’s `/kodik/stream`.

**Architecture:** Static SPA. Shikimori public data is fetched directly from the browser (GraphQL + REST). Kodik and the OAuth code→token exchange go through the `anime-proxy` Worker. TanStack Query owns server cache; Zustand owns watch-progress persisted to localStorage; react-router owns navigation; `vite-plugin-pwa` provides the service worker, manifest, and runtime caching. The visual layer is built via the **design-taste-frontend** skill (Task 4) — no default UI-kit look.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom, @tanstack/react-query, zustand, hls.js, vite-plugin-pwa, Vitest, @testing-library/react.

**Repo:** this repository, `pyw0w.github.io` (GitHub Pages user site, base `/`).

**Depends on:** the `anime-proxy` Worker (separate plan) being deployed; its URL goes in `VITE_WORKER_URL`.

---

## File Structure

```
pyw0w.github.io/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  .env.example
  public/
    icons/icon-192.png, icon-512.png, maskable-512.png
  src/
    main.tsx                 # bootstrap: QueryClient, Router, AuthProvider, SW
    App.tsx                  # layout shell + <Outlet/>
    router.tsx               # route table
    config.ts                # env-derived constants
    api/
      worker.ts              # anime-proxy client (search/translations/stream/oauth)
      shikimori.ts           # graphql() + REST user_rates helpers
      types.ts               # shared API types
    auth/
      oauth.ts               # authorize url, token storage, refresh, ensureToken
      AuthContext.tsx        # provider + useAuth()
    store/
      progress.ts            # zustand watch-progress (localStorage)
    features/
      catalog/CatalogPage.tsx
      search/SearchPage.tsx
      anime/AnimePage.tsx     # details + episode/translation pickers + <Player/>
      anime/useKodikMatch.ts  # map shikimori id -> kodik translations/episodes
      player/Player.tsx       # hls.js component
      lists/ListsPage.tsx
      auth/LoginPage.tsx
      auth/CallbackPage.tsx
    components/               # design-system primitives (Task 4 fills these)
    pwa/registerSW.ts
  .github/workflows/deploy.yml
```

---

## Task 1: Scaffold Vite + React + TS

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.example`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "anime-pwa",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.40.0",
    "hls.js": "^1.5.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.1.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create `vite.config.ts`** (PWA configured fully in Task 12; minimal here)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Anime PWA</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `.env.example` and `.gitignore`**

`.env.example`:
```
VITE_WORKER_URL=https://anime-proxy.YOURNAME.workers.dev
VITE_SHIKIMORI_CLIENT_ID=your_client_id
VITE_SHIKIMORI_AUTH_BASE=https://shikimori.io
VITE_OAUTH_REDIRECT_URI=https://pyw0w.github.io/oauth/callback
```
`.gitignore`:
```
node_modules
dist
.env
.env.local
```

- [ ] **Step 6: Create `src/main.tsx` and `src/App.tsx` (minimal placeholders)**

`src/App.tsx`:
```tsx
export default function App() {
  return <div>anime pwa</div>;
}
```
`src/main.tsx`:
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create `test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 8: Install, typecheck, build**

Run: `npm install && npm run typecheck && npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + react + ts pwa"
```

---

## Task 2: Config module

**Files:**
- Create: `src/config.ts`, `test/config.test.ts`

- [ ] **Step 1: Write failing test `test/config.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { config } from '../src/config';

describe('config', () => {
  it('exposes worker + shikimori settings', () => {
    expect(config.workerUrl).toBeTypeOf('string');
    expect(config.shikimoriAuthBase).toContain('shikimori');
    expect(config.oauthRedirectUri).toContain('/oauth/callback');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/config.test.ts`
Expected: FAIL (no module).

- [ ] **Step 3: Create `src/config.ts`**

```ts
export const config = {
  workerUrl: import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787',
  shikimoriApiBase: 'https://shikimori.io',
  shikimoriAuthBase: import.meta.env.VITE_SHIKIMORI_AUTH_BASE ?? 'https://shikimori.io',
  shikimoriClientId: import.meta.env.VITE_SHIKIMORI_CLIENT_ID ?? '',
  oauthRedirectUri:
    import.meta.env.VITE_OAUTH_REDIRECT_URI ?? 'https://pyw0w.github.io/oauth/callback',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/config.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add config module"
```

---

## Task 3: Worker API client

**Files:**
- Create: `src/api/types.ts`, `src/api/worker.ts`, `test/worker-api.test.ts`

- [ ] **Step 1: Create `src/api/types.ts`**

```ts
export interface KodikTranslation {
  id: string;
  title: string;
  type: 'озвучка' | 'субтитры' | 'Неизвестно';
}

export interface StreamResult {
  manifest: string;
  qualities: number[];
}

export interface ShikimoriAnime {
  id: string;
  name: string;
  russian: string | null;
  image: { original: string | null; preview: string | null };
  score: string | null;
  episodes: number;
  episodesAired: number;
  kind: string | null;
  status: string | null;
  description: string | null;
}
```

- [ ] **Step 2: Write failing test `test/worker-api.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { workerApi } from '../src/api/worker';

afterEach(() => vi.unstubAllGlobals());

describe('workerApi.stream', () => {
  it('calls /kodik/stream with query params', async () => {
    let url = '';
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      url = u;
      return new Response(JSON.stringify({ manifest: 'm.m3u8', qualities: [480, 720] }), { status: 200 });
    }));
    const res = await workerApi.stream({ id: '20', episode: 2, translation: '610' });
    expect(url).toContain('/kodik/stream');
    expect(url).toContain('id=20');
    expect(url).toContain('episode=2');
    expect(url).toContain('translation=610');
    expect(res.qualities).toEqual([480, 720]);
  });

  it('throws on non-ok with server message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: 'extract_failed', message: 'boom' }), { status: 502 })));
    await expect(workerApi.stream({ id: 'x', episode: 1, translation: '0' }))
      .rejects.toThrow('boom');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- test/worker-api.test.ts`
Expected: FAIL.

- [ ] **Step 4: Create `src/api/worker.ts`**

```ts
import { config } from '../config';
import type { StreamResult } from './types';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.workerUrl}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Worker ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${config.workerUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Worker ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const workerApi = {
  search(params: { title?: string; id?: string; idType?: string }) {
    const q = new URLSearchParams();
    if (params.title) q.set('title', params.title);
    if (params.id) q.set('id', params.id);
    q.set('id_type', params.idType ?? 'shikimori');
    return get<unknown>(`/kodik/search?${q}`);
  },
  translations(id: string) {
    return get<unknown>(`/kodik/translations?id=${encodeURIComponent(id)}`);
  },
  stream(params: { id: string; episode: number; translation: string }) {
    const q = new URLSearchParams({
      id: params.id,
      episode: String(params.episode),
      translation: params.translation,
    });
    return get<StreamResult>(`/kodik/stream?${q}`);
  },
  exchangeOAuthCode(code: string) {
    return post<{ access_token: string; refresh_token: string; expires_in: number }>(
      '/auth/shikimori/token', { code });
  },
  refreshOAuth(refresh_token: string) {
    return post<{ access_token: string; refresh_token: string; expires_in: number }>(
      '/auth/shikimori/token', { refresh_token });
  },
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- test/worker-api.test.ts`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add worker api client"
```

---

## Task 4: Establish the design system (design-taste-frontend)

This task produces the visual foundation BEFORE feature UIs are built, per the spec’s mandate.

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/components/` primitives (e.g. `Button.tsx`, `Card.tsx`, `Spinner.tsx`, `AppBar.tsx`)
- Modify: `src/main.tsx` (import global css)

- [ ] **Step 1: Invoke the design skill**

Use the **design-taste-frontend** skill. Brief it with: product = installable anime catalog + player PWA; audience = anime viewers on mobile-first; tone per the skill’s audit-first, anti-templated guidance. Produce: a real design system — color tokens (incl. dark default), type scale, spacing scale, radius/elevation, and an inventory of primitives (Button, Card/Poster, Tag/Badge, AppBar/BottomNav, Spinner, EmptyState).

- [ ] **Step 2: Write `src/styles/tokens.css` and `src/styles/global.css`** from the skill’s output (CSS custom properties for color/space/type; base resets; mobile-first).

- [ ] **Step 3: Implement the primitive components** in `src/components/` exactly as the skill specifies (props, variants, states). Each primitive is a small focused file.

- [ ] **Step 4: Add a render smoke test `test/components.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/Button';

it('renders a button label', () => {
  render(<Button>Смотреть</Button>);
  expect(screen.getByRole('button', { name: 'Смотреть' })).toBeInTheDocument();
});
```

- [ ] **Step 5: Import global css in `src/main.tsx`**

```tsx
import './styles/global.css';
```

- [ ] **Step 6: Run test + build**

Run: `npm test -- test/components.test.tsx && npm run build`
Expected: PASS + build OK.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: design system + primitives via design-taste-frontend"
```

---

## Task 5: Shikimori API client (GraphQL + REST)

**Files:**
- Create: `src/api/shikimori.ts`, `test/shikimori-api.test.ts`

- [ ] **Step 1: Write failing test `test/shikimori-api.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { shikimori } from '../src/api/shikimori';

afterEach(() => vi.unstubAllGlobals());

describe('shikimori.graphql', () => {
  it('posts a query and returns data', async () => {
    let body = '';
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => {
      body = String(init.body);
      return new Response(JSON.stringify({ data: { animes: [{ id: '1', name: 'X' }] } }), { status: 200 });
    }));
    const data = await shikimori.graphql<{ animes: any[] }>('query{animes{id}}');
    expect(body).toContain('animes');
    expect(data.animes[0].id).toBe('1');
  });

  it('throws on graphql errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ errors: [{ message: 'bad' }] }), { status: 200 })));
    await expect(shikimori.graphql('query{}')).rejects.toThrow('bad');
  });
});

describe('shikimori.userRates', () => {
  it('sends bearer token', async () => {
    let auth = '';
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => {
      auth = init.headers.Authorization;
      return new Response(JSON.stringify([]), { status: 200 });
    }));
    await shikimori.userRates('tok123', { user_id: 5, status: 'watching' });
    expect(auth).toBe('Bearer tok123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/shikimori-api.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create `src/api/shikimori.ts`**

```ts
import { config } from '../config';

const GRAPHQL_URL = `${config.shikimoriApiBase}/api/graphql`;

async function graphql<T>(query: string, variables?: Record<string, unknown>, token?: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error('Empty GraphQL response');
  return json.data;
}

async function userRates(
  token: string,
  params: { user_id: number; status?: string; limit?: number; page?: number },
): Promise<unknown[]> {
  const q = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((a, [k, v]) => {
      if (v !== undefined) a[k] = String(v);
      return a;
    }, {}),
  );
  const res = await fetch(`${config.shikimoriApiBase}/api/v2/user_rates?${q}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`user_rates -> ${res.status}`);
  return res.json() as Promise<unknown[]>;
}

async function whoami(token: string): Promise<{ id: number; nickname: string }> {
  const res = await fetch(`${config.shikimoriApiBase}/api/users/whoami`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('whoami failed');
  return res.json() as Promise<{ id: number; nickname: string }>;
}

export const shikimori = { graphql, userRates, whoami };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/shikimori-api.test.ts`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add shikimori graphql + rest client"
```

---

## Task 6: OAuth — token storage, refresh, authorize URL

**Files:**
- Create: `src/auth/oauth.ts`, `test/oauth.test.ts`

- [ ] **Step 1: Write failing test `test/oauth.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAuthorizeUrl, saveTokens, loadTokens, isExpired, clearTokens } from '../src/auth/oauth';

beforeEach(() => localStorage.clear());

describe('buildAuthorizeUrl', () => {
  it('contains client_id, redirect_uri, response_type=code', () => {
    const url = buildAuthorizeUrl();
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('/oauth/authorize');
  });
});

describe('token storage', () => {
  it('saves and loads tokens with computed expiry', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 100 });
    const t = loadTokens()!;
    expect(t.access_token).toBe('a');
    expect(t.expires_at).toBeGreaterThan(Date.now());
  });

  it('isExpired true when past expiry', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: -10 });
    expect(isExpired(loadTokens()!)).toBe(true);
  });

  it('clearTokens removes them', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 100 });
    clearTokens();
    expect(loadTokens()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/oauth.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create `src/auth/oauth.ts`**

```ts
import { config } from '../config';
import { workerApi } from '../api/worker';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

const KEY = 'shikimori_tokens';
const SKEW_MS = 60_000;

export function buildAuthorizeUrl(): string {
  const q = new URLSearchParams({
    client_id: config.shikimoriClientId,
    redirect_uri: config.oauthRedirectUri,
    response_type: 'code',
    scope: 'user_rates',
  });
  return `${config.shikimoriAuthBase}/oauth/authorize?${q}`;
}

export function saveTokens(t: { access_token: string; refresh_token: string; expires_in: number }): void {
  const stored: StoredTokens = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + t.expires_in * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export function loadTokens(): StoredTokens | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

export function clearTokens(): void {
  localStorage.removeItem(KEY);
}

export function isExpired(t: StoredTokens): boolean {
  return Date.now() >= t.expires_at - SKEW_MS;
}

/** Returns a valid access token, refreshing through the Worker if needed. */
export async function ensureAccessToken(): Promise<string | null> {
  const t = loadTokens();
  if (!t) return null;
  if (!isExpired(t)) return t.access_token;
  const refreshed = await workerApi.refreshOAuth(t.refresh_token);
  saveTokens(refreshed);
  return refreshed.access_token;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/oauth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: oauth token storage + refresh + authorize url"
```

---

## Task 7: Auth context + provider

**Files:**
- Create: `src/auth/AuthContext.tsx`, `test/auth-context.test.tsx`

- [ ] **Step 1: Write failing test `test/auth-context.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { saveTokens } from '../src/auth/oauth';

beforeEach(() => localStorage.clear());

function Probe() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span>auth:{String(isAuthenticated)}</span>
      <button onClick={logout}>out</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('reports authenticated when tokens exist', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('auth:true')).toBeInTheDocument();
  });

  it('logout clears auth', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 1000 });
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => screen.getByText('out').click());
    expect(screen.getByText('auth:false')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/auth-context.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create `src/auth/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { loadTokens, clearTokens, saveTokens } from './oauth';

interface AuthState {
  isAuthenticated: boolean;
  login: (t: { access_token: string; refresh_token: string; expires_in: number }) => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => loadTokens() !== null);

  const login = useCallback((t: { access_token: string; refresh_token: string; expires_in: number }) => {
    saveTokens(t);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAuthed(false);
  }, []);

  return <Ctx.Provider value={{ isAuthenticated: authed, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/auth-context.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: auth context provider"
```

---

## Task 8: Watch-progress store (Zustand + localStorage)

**Files:**
- Create: `src/store/progress.ts`, `test/progress.test.ts`

- [ ] **Step 1: Write failing test `test/progress.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useProgress } from '../src/store/progress';

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ entries: {} });
});

describe('progress store', () => {
  it('records and reads episode position', () => {
    useProgress.getState().setPosition('20', 3, 120);
    expect(useProgress.getState().getPosition('20', 3)).toBe(120);
  });

  it('persists across reads via localStorage', () => {
    useProgress.getState().setPosition('20', 1, 50);
    expect(localStorage.getItem('watch_progress')).toContain('"20"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/progress.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create `src/store/progress.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Entries = Record<string, Record<number, number>>; // animeId -> episode -> seconds

interface ProgressState {
  entries: Entries;
  setPosition: (animeId: string, episode: number, seconds: number) => void;
  getPosition: (animeId: string, episode: number) => number;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: {},
      setPosition: (animeId, episode, seconds) =>
        set((s) => ({
          entries: { ...s.entries, [animeId]: { ...s.entries[animeId], [episode]: seconds } },
        })),
      getPosition: (animeId, episode) => get().entries[animeId]?.[episode] ?? 0,
    }),
    { name: 'watch_progress' },
  ),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: watch-progress store"
```

---

## Task 9: Player component (hls.js)

**Files:**
- Create: `src/features/player/Player.tsx`, `test/player.test.tsx`

- [ ] **Step 1: Write failing test `test/player.test.tsx`** (mock hls.js)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const attachMedia = vi.fn();
const loadSource = vi.fn();
vi.mock('hls.js', () => {
  class FakeHls {
    static isSupported() { return true; }
    static Events = { ERROR: 'hlsError' };
    attachMedia = attachMedia;
    loadSource = loadSource;
    on = vi.fn();
    destroy = vi.fn();
  }
  return { default: FakeHls };
});

import { Player } from '../src/features/player/Player';

beforeEach(() => { attachMedia.mockClear(); loadSource.mockClear(); });

describe('Player', () => {
  it('loads the manifest through hls.js when supported', () => {
    render(<Player manifest="https://x/master.m3u8" />);
    expect(screen.getByTestId('video')).toBeInTheDocument();
    expect(loadSource).toHaveBeenCalledWith('https://x/master.m3u8');
    expect(attachMedia).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/player.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create `src/features/player/Player.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  manifest: string;
  startAt?: number;
  onTime?: (seconds: number) => void;
}

export function Player({ manifest, startAt = 0, onTime }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(manifest);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifest; // Safari native HLS
    }

    const onMeta = () => { if (startAt > 0) video.currentTime = startAt; };
    const onTimeUpdate = () => onTime?.(Math.floor(video.currentTime));
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      hls?.destroy();
    };
  }, [manifest, startAt, onTime]);

  return <video data-testid="video" ref={videoRef} controls playsInline style={{ width: '100%' }} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/player.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: hls.js player component"
```

---

## Task 10: Router + pages wiring (Query, Auth, routes)

**Files:**
- Create: `src/router.tsx`, page stubs under `src/features/*`, `src/features/auth/CallbackPage.tsx`, `src/features/auth/LoginPage.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`
- Create: `test/callback.test.tsx`

- [ ] **Step 1: Create page stubs** (each a focused file; catalog/search/anime/lists render a heading + later logic)

`src/features/catalog/CatalogPage.tsx`:
```tsx
export default function CatalogPage() { return <h1>Каталог</h1>; }
```
`src/features/search/SearchPage.tsx`:
```tsx
export default function SearchPage() { return <h1>Поиск</h1>; }
```
`src/features/anime/AnimePage.tsx`:
```tsx
export default function AnimePage() { return <h1>Тайтл</h1>; }
```
`src/features/lists/ListsPage.tsx`:
```tsx
export default function ListsPage() { return <h1>Мои списки</h1>; }
```
`src/features/auth/LoginPage.tsx`:
```tsx
import { buildAuthorizeUrl } from '../../auth/oauth';
export default function LoginPage() {
  return <a href={buildAuthorizeUrl()}>Войти через Shikimori</a>;
}
```

- [ ] **Step 2: Create `src/features/auth/CallbackPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workerApi } from '../../api/worker';
import { useAuth } from '../../auth/AuthContext';

export default function CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const code = params.get('code');
    if (!code) { setError('Нет кода авторизации'); return; }
    workerApi.exchangeOAuthCode(code)
      .then((t) => { login(t); navigate('/lists', { replace: true }); })
      .catch((e) => setError(String(e.message ?? e)));
  }, [params, login, navigate]);

  return <div>{error ? `Ошибка входа: ${error}` : 'Входим…'}</div>;
}
```

- [ ] **Step 3: Create `src/router.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import CatalogPage from './features/catalog/CatalogPage';
import SearchPage from './features/search/SearchPage';
import AnimePage from './features/anime/AnimePage';
import ListsPage from './features/lists/ListsPage';
import LoginPage from './features/auth/LoginPage';
import CallbackPage from './features/auth/CallbackPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'anime/:id', element: <AnimePage /> },
      { path: 'lists', element: <ListsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'oauth/callback', element: <CallbackPage /> },
    ],
  },
]);
```

- [ ] **Step 4: Update `src/App.tsx`** (layout shell with nav + outlet)

```tsx
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Каталог</Link> · <Link to="/search">Поиск</Link> ·{' '}
        <Link to="/lists">Списки</Link> · <Link to="/login">Вход</Link>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/main.tsx`** (QueryClient + Auth + Router)

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { router } from './router';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Write `test/callback.test.tsx`**

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import CallbackPage from '../src/features/auth/CallbackPage';

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

it('exchanges code and stores tokens', async () => {
  vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 1000 }), { status: 200 })));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/oauth/callback?code=xyz']}>
        <Routes>
          <Route path="/oauth/callback" element={<CallbackPage />} />
          <Route path="/lists" element={<div>lists page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await waitFor(() => expect(localStorage.getItem('shikimori_tokens')).toContain('"a"'));
});
```

- [ ] **Step 7: Run tests + build**

Run: `npm test -- test/callback.test.tsx && npm run build`
Expected: PASS + build OK.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: router, pages, oauth callback, app shell"
```

---

## Task 11: Catalog, Search, Anime detail + episode/translation picker

**Files:**
- Modify: `src/features/catalog/CatalogPage.tsx`, `src/features/search/SearchPage.tsx`, `src/features/anime/AnimePage.tsx`
- Create: `src/api/queries.ts`, `src/features/anime/useKodikMatch.ts`, `test/queries.test.ts`

- [ ] **Step 1: Create `src/api/queries.ts`** (Shikimori GraphQL queries + hooks)

```ts
import { useQuery } from '@tanstack/react-query';
import { shikimori } from './shikimori';
import type { ShikimoriAnime } from './types';

const ANIME_FIELDS = `
  id name russian score episodes episodesAired kind status
  image { original preview } description
`;

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query { animes(order: ranked, limit: 30, kind: "tv") { ${ANIME_FIELDS} } }`,
      );
      return data.animes;
    },
  });
}

export function useSearch(term: string) {
  return useQuery({
    queryKey: ['search', term],
    enabled: term.trim().length > 1,
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query($q: String!) { animes(search: $q, limit: 25) { ${ANIME_FIELDS} } }`,
        { q: term },
      );
      return data.animes;
    },
  });
}

export function useAnime(id: string) {
  return useQuery({
    queryKey: ['anime', id],
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query($id: String!) { animes(ids: $id, limit: 1) { ${ANIME_FIELDS} } }`,
        { id },
      );
      return data.animes[0] ?? null;
    },
  });
}
```

- [ ] **Step 2: Write failing test `test/queries.test.ts`** (verify query shape via mocked fetch)

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { shikimori } from '../src/api/shikimori';

afterEach(() => vi.unstubAllGlobals());

it('graphql search passes the term as a variable', async () => {
  let body: any = {};
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({ data: { animes: [] } }), { status: 200 });
  }));
  await shikimori.graphql('query($q:String!){animes(search:$q){id}}', { q: 'bleach' });
  expect(body.variables.q).toBe('bleach');
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- test/queries.test.ts`
Expected: PASS.

- [ ] **Step 4: Create `src/features/anime/useKodikMatch.ts`** (map Shikimori id → Kodik translations/episodes)

```ts
import { useQuery } from '@tanstack/react-query';
import { workerApi } from '../../api/worker';

interface KodikRaw {
  results?: Array<{
    translation?: { id: number; title: string; type: string };
    last_season?: number;
    episodes_count?: number;
    seasons?: Record<string, { episodes?: Record<string, string> }>;
  }>;
}

export interface KodikMatch {
  translations: Array<{ id: string; title: string; type: string }>;
  episodes: number;
}

export function useKodikMatch(shikimoriId: string) {
  return useQuery<KodikMatch>({
    queryKey: ['kodik-match', shikimoriId],
    queryFn: async () => {
      const raw = (await workerApi.search({ id: shikimoriId })) as KodikRaw;
      const results = raw.results ?? [];
      const seen = new Set<string>();
      const translations: KodikMatch['translations'] = [];
      let episodes = 0;
      for (const r of results) {
        if (r.translation) {
          const id = String(r.translation.id);
          if (!seen.has(id)) {
            seen.add(id);
            translations.push({ id, title: r.translation.title, type: r.translation.type });
          }
        }
        episodes = Math.max(episodes, r.episodes_count ?? 0);
      }
      return { translations, episodes: episodes || 1 };
    },
  });
}
```

- [ ] **Step 5: Implement `CatalogPage.tsx`** (grid of poster Cards from design system)

```tsx
import { Link } from 'react-router-dom';
import { useCatalog } from '../../api/queries';

export default function CatalogPage() {
  const { data, isLoading, error } = useCatalog();
  if (isLoading) return <p>Загрузка…</p>;
  if (error) return <p>Ошибка загрузки каталога</p>;
  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, listStyle: 'none', padding: 0 }}>
      {data!.map((a) => (
        <li key={a.id}>
          <Link to={`/anime/${a.id}`}>
            {a.image.preview && <img src={`https://shikimori.io${a.image.preview}`} alt="" style={{ width: '100%' }} />}
            <div>{a.russian ?? a.name}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

(Replace the inline poster markup with the design-system `Card`/`Poster` primitives from Task 4.)

- [ ] **Step 6: Implement `SearchPage.tsx`**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../../api/queries';

export default function SearchPage() {
  const [term, setTerm] = useState('');
  const { data, isFetching } = useSearch(term);
  return (
    <div>
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Поиск аниме…" />
      {isFetching && <span> …</span>}
      <ul>
        {(data ?? []).map((a) => (
          <li key={a.id}><Link to={`/anime/${a.id}`}>{a.russian ?? a.name}</Link></li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: Implement `AnimePage.tsx`** (details + pickers + player)

```tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnime } from '../../api/queries';
import { useKodikMatch } from './useKodikMatch';
import { workerApi } from '../../api/worker';
import { Player } from '../player/Player';
import { useProgress } from '../../store/progress';

export default function AnimePage() {
  const { id = '' } = useParams();
  const anime = useAnime(id);
  const match = useKodikMatch(id);
  const [translation, setTranslation] = useState<string>('0');
  const [episode, setEpisode] = useState<number>(1);
  const { getPosition, setPosition } = useProgress();

  const effectiveTranslation = translation !== '0'
    ? translation
    : match.data?.translations[0]?.id ?? '0';

  const stream = useQuery({
    queryKey: ['stream', id, episode, effectiveTranslation],
    enabled: Boolean(match.data),
    queryFn: () => workerApi.stream({ id, episode, translation: effectiveTranslation }),
  });

  if (anime.isLoading) return <p>Загрузка…</p>;
  if (!anime.data) return <p>Тайтл не найден</p>;
  const a = anime.data;
  const episodesCount = match.data?.episodes ?? a.episodes ?? 1;

  return (
    <article>
      <h1>{a.russian ?? a.name}</h1>
      {match.data && (
        <div>
          <label>Озвучка:{' '}
            <select value={effectiveTranslation} onChange={(e) => setTranslation(e.target.value)}>
              {match.data.translations.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
              ))}
            </select>
          </label>
          <label> Серия:{' '}
            <select value={episode} onChange={(e) => setEpisode(Number(e.target.value))}>
              {Array.from({ length: episodesCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {stream.isError && <p>Не удалось получить поток. Попробуйте другую озвучку.</p>}
      {stream.data && (
        <Player
          manifest={stream.data.manifest}
          startAt={getPosition(id, episode)}
          onTime={(s) => setPosition(id, episode, s)}
        />
      )}
      <p>{a.description}</p>
    </article>
  );
}
```

- [ ] **Step 8: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS + build OK.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: catalog, search, anime detail with player"
```

---

## Task 12: Lists page (authenticated)

**Files:**
- Modify: `src/features/lists/ListsPage.tsx`
- Create: `test/lists.test.tsx`

- [ ] **Step 1: Implement `ListsPage.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { ensureAccessToken } from '../../auth/oauth';
import { shikimori } from '../../api/shikimori';

export default function ListsPage() {
  const { isAuthenticated } = useAuth();

  const rates = useQuery({
    queryKey: ['user-rates'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await ensureAccessToken();
      if (!token) throw new Error('no token');
      const me = await shikimori.whoami(token);
      return shikimori.userRates(token, { user_id: me.id, status: 'watching', limit: 50 });
    },
  });

  if (!isAuthenticated) return <p>Войдите через Shikimori, чтобы увидеть списки.</p>;
  if (rates.isLoading) return <p>Загрузка списков…</p>;
  if (rates.isError) return <p>Не удалось загрузить списки</p>;
  return <pre>{JSON.stringify(rates.data, null, 2)}</pre>;
}
```

(Replace the `<pre>` dump with design-system list items showing title + progress.)

- [ ] **Step 2: Write `test/lists.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ListsPage from '../src/features/lists/ListsPage';

it('prompts to log in when unauthenticated', () => {
  localStorage.clear();
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter><ListsPage /></MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(screen.getByText(/Войдите через Shikimori/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- test/lists.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: authenticated lists page"
```

---

## Task 13: PWA — manifest, icons, service worker, runtime caching

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`

- [ ] **Step 1: Add icons** to `public/icons/` (192, 512, maskable 512). Generate from a single source PNG with any tool; commit the three files.

- [ ] **Step 2: Update `vite.config.ts` with `vite-plugin-pwa`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Anime PWA',
        short_name: 'Anime',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0b0f',
        theme_color: '#0b0b0f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('shikimori.io') && url.pathname.includes('/system/'),
            handler: 'CacheFirst',
            options: { cacheName: 'posters', expiration: { maxEntries: 300, maxAgeSeconds: 604800 } },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('shikimori.io') && url.pathname.startsWith('/api'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'shikimori-api', expiration: { maxEntries: 200, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, setupFiles: './test/setup.ts' },
});
```

Note: video segments (`.ts`/`.m3u8` from Kodik CDN) are intentionally NOT cached.

- [ ] **Step 3: Build and verify SW + manifest emitted**

Run: `npm run build`
Expected: `dist/sw.js` and `dist/manifest.webmanifest` exist.

- [ ] **Step 4: Preview and confirm installability**

Run: `npm run preview`
Open the preview URL, DevTools → Application → Manifest shows the icons and “installable”.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: pwa manifest, icons, service worker, runtime caching"
```

---

## Task 14: GitHub Pages deploy (Actions)

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - name: SPA 404 fallback
        run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
    env:
      VITE_WORKER_URL: ${{ vars.VITE_WORKER_URL }}
      VITE_SHIKIMORI_CLIENT_ID: ${{ vars.VITE_SHIKIMORI_CLIENT_ID }}
      VITE_SHIKIMORI_AUTH_BASE: https://shikimori.io
      VITE_OAUTH_REDIRECT_URI: https://pyw0w.github.io/oauth/callback
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Configure repo settings**

In GitHub repo: Settings → Pages → Source = “GitHub Actions”. Settings → Secrets and variables → Actions → Variables: add `VITE_WORKER_URL` (deployed Worker URL) and `VITE_SHIKIMORI_CLIENT_ID`.

- [ ] **Step 3: Push and verify deploy**

Run: `git push origin main`
Then watch the Actions run; once green, open `https://pyw0w.github.io` — catalog loads, install prompt appears, OAuth round-trip works end-to-end against the deployed Worker.

- [ ] **Step 4: Commit (workflow already committed by push)**

```bash
git add -A && git commit -m "ci: deploy pwa to github pages" || true
```

---

## Self-Review (Frontend plan)

- **Spec coverage:**
  - Routing `/`, `/search`, `/anime/:id`, `/login`, `/oauth/callback`, `/lists` → T10. (`/settings` from spec §4 is deferred — see note.)
  - Structure `src/api|features|components|store|pwa` → present across T2–T13.
  - TanStack Query → T10/T11. Zustand progress → T8. hls.js player + native Safari + localStorage position → T9/T11.
  - Shikimori direct (GraphQL + REST user_rates, whoami) → T5/T11/T12. OAuth via Worker, refresh, storage → T6/T7/T10.
  - Kodik only via Worker (search/translations/stream) → T3/T11. Stream→hls.js → T11.
  - PWA install + offline app-shell + runtime cache (posters CacheFirst, API SWR), video NOT cached → T13.
  - design-taste-frontend mandate → T4 (runs before feature UIs; T11/T12 note to swap in primitives).
  - Error layer (network / 429 surfaced by Worker / invalid token / “stream not found”) → worker client throws server message (T3), AnimePage shows stream-error message (T11), lists shows error (T12).
  - Testing: api-client + oauth unit tests (T3/T5/T6), player test with mocked hls.js (T9) → spec §9.
- **Deferred (called out, not silently dropped):** `/settings` route and Shikimori list write-back (marking watched) are out of MVP §10; add a settings page + `POST/PATCH user_rates` in a follow-up. Catalog/Search/Anime/Lists currently use minimal markup with an explicit instruction to substitute Task 4 design-system primitives.
- **Type consistency:** `workerApi.stream → StreamResult {manifest,qualities}` matches `Player`/AnimePage usage; `saveTokens/loadTokens/ensureAccessToken` names consistent across T6/T7/T10/T12; `useProgress.getPosition/setPosition` consistent T8/T11.
- **No placeholders:** every code step contains real code; icon/design-system steps reference concrete outputs (Task 4 / generated PNGs), not “TBD”.
