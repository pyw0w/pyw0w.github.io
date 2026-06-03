# Anime Proxy Worker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `anime-proxy`, a Hono Worker on Cloudflare that proxies Kodik (search / translations / HLS stream extraction) and performs the Shikimori OAuth code→token exchange, so the static PWA frontend never touches Kodik tokens or the Shikimori client secret.

**Architecture:** A single Hono app deployed to Cloudflare Workers. Pure-function modules (no cheerio) do Kodik token acquisition, API proxying, and HLS-manifest extraction (ported from `aerosstube/anime-kodik-parser` using regex + `atob` instead of cheerio + `base-64`). The Kodik token is cached in Workers KV. All modules take an injected `fetch` and `env` so they unit-test with mocked network and KV.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, Workers KV, Wrangler, Vitest.

**Repo:** separate repository `anime-proxy` (NOT inside `pyw0w.github.io`).

---

## File Structure

```
anime-proxy/
  package.json
  tsconfig.json
  wrangler.jsonc
  vitest.config.ts
  .dev.vars                 # local secrets (gitignored)
  .gitignore
  README.md
  scripts/
    capture-fixtures.mjs    # one-off: pull real Kodik HTML/JS into test/fixtures
  src/
    index.ts               # Hono app + route mounting + error handler
    env.ts                 # Env type + Fetcher type
    cors.ts                # CORS middleware (single allowed origin)
    errors.ts              # AppError hierarchy + toResponse()
    http.ts                # fetchJson/fetchText helpers w/ 429 backoff
    kodik/
      strings.ts           # extractBetween + small parsing helpers
      token.ts             # getKodikToken() with KV cache
      api.ts               # kodikApi() proxy to kodik-api.com
      extract.ts           # extractStream() -> { manifest, qualities }
    auth/
      shikimori.ts         # exchangeCode() / refreshToken()
    routes/
      kodik.ts             # GET /kodik/search, /translations, /stream
      auth.ts              # POST /auth/shikimori/token
  test/
    fixtures/
      add-players.js
      player-serial.html
      player-script.js
      video-response.json
    strings.test.ts
    token.test.ts
    api.test.ts
    extract.test.ts
    cors.test.ts
    auth.test.ts
    routes.test.ts
```

Each module has one responsibility. `extract.ts` is the only fragile unit (Kodik page shape); it is isolated behind a single `extractStream()` contract so breakage is contained and testable against fixtures.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `wrangler.jsonc`, `vitest.config.ts`, `.gitignore`, `.dev.vars`, `src/index.ts`, `src/env.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "anime-proxy",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240512.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "wrangler": "^3.60.0"
  },
  "dependencies": {
    "hono": "^4.4.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create `wrangler.jsonc`**

Replace `<KV_ID>` after running `wrangler kv namespace create KODIK_KV` (Task 3 documents this; placeholder id is fine until first deploy).

```jsonc
{
  "name": "anime-proxy",
  "main": "src/index.ts",
  "compatibility_date": "2024-05-12",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [
    { "binding": "KODIK_KV", "id": "<KV_ID>" }
  ],
  "vars": {
    "ALLOWED_ORIGIN": "https://pyw0w.github.io",
    "SHIKIMORI_REDIRECT_URI": "https://pyw0w.github.io/oauth/callback"
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules
.dev.vars
.wrangler
dist
```

- [ ] **Step 5: Create `.dev.vars` (local secrets, gitignored)**

```
SHIKIMORI_CLIENT_ID=replace_me
SHIKIMORI_CLIENT_SECRET=replace_me
KODIK_TOKEN=
```

- [ ] **Step 6: Create `src/env.ts`**

```ts
export interface Env {
  KODIK_KV: KVNamespace;
  ALLOWED_ORIGIN: string;
  SHIKIMORI_CLIENT_ID: string;
  SHIKIMORI_CLIENT_SECRET: string;
  SHIKIMORI_REDIRECT_URI: string;
  /** Optional manual override; when empty, token is fetched + cached. */
  KODIK_TOKEN?: string;
}

/** Injectable fetch so modules unit-test with a mock. */
export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
```

- [ ] **Step 7: Create `src/index.ts` (minimal app + health route)**

```ts
import { Hono } from 'hono';
import type { Env } from './env';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ ok: true }));

export default app;
```

- [ ] **Step 8: Install and typecheck**

Run: `npm install && npm run typecheck`
Expected: exits 0, no type errors.

- [ ] **Step 9: Commit**

```bash
git init && git add -A
git commit -m "chore: scaffold anime-proxy worker"
```

---

## Task 2: Vitest config + health route test

**Files:**
- Create: `vitest.config.ts`, `test/routes.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write failing test `test/routes.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import app from '../src/index';

const ENV = {
  ALLOWED_ORIGIN: 'https://pyw0w.github.io',
} as any;

describe('health', () => {
  it('returns ok', async () => {
    const res = await app.request('/health', {}, ENV);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- test/routes.test.ts`
Expected: PASS (health route already exists).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: add vitest + health route test"
```

---

## Task 3: CORS middleware

**Files:**
- Create: `src/cors.ts`, `test/cors.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing test `test/cors.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import app from '../src/index';

const ENV = { ALLOWED_ORIGIN: 'https://pyw0w.github.io' } as any;

describe('cors', () => {
  it('echoes allowed origin', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://pyw0w.github.io' },
    }, ENV);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://pyw0w.github.io');
  });

  it('does not allow a foreign origin', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://evil.example' },
    }, ENV);
    expect(res.headers.get('access-control-allow-origin')).not.toBe('https://evil.example');
  });

  it('answers preflight with 204', async () => {
    const res = await app.request('/kodik/search', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://pyw0w.github.io',
        'Access-Control-Request-Method': 'GET',
      },
    }, ENV);
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/cors.test.ts`
Expected: FAIL (no CORS headers yet).

- [ ] **Step 3: Create `src/cors.ts`**

```ts
import { cors } from 'hono/cors';
import type { Env } from './env';
import type { MiddlewareHandler } from 'hono';

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const handler = cors({
      origin: (origin) => (origin === c.env.ALLOWED_ORIGIN ? origin : ''),
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    });
    return handler(c, next);
  };
}
```

- [ ] **Step 4: Wire it in `src/index.ts`**

```ts
import { Hono } from 'hono';
import type { Env } from './env';
import { corsMiddleware } from './cors';

const app = new Hono<{ Bindings: Env }>();

app.use('*', corsMiddleware());

app.get('/health', (c) => c.json({ ok: true }));

export default app;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- test/cors.test.ts`
Expected: PASS (all three).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: restrict CORS to the GitHub Pages origin"
```

---

## Task 4: Error hierarchy + handler

**Files:**
- Create: `src/errors.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create `src/errors.ts`**

```ts
export type AppErrorCode =
  | 'bad_request'
  | 'upstream_error'
  | 'rate_limited'
  | 'not_found'
  | 'token_error'
  | 'extract_failed';

const STATUS: Record<AppErrorCode, number> = {
  bad_request: 400,
  upstream_error: 502,
  rate_limited: 429,
  not_found: 404,
  token_error: 502,
  extract_failed: 502,
};

export class AppError extends Error {
  constructor(public code: AppErrorCode, message: string) {
    super(message);
  }
  get status(): number {
    return STATUS[this.code];
  }
  toJSON() {
    return { error: this.code, message: this.message };
  }
}
```

- [ ] **Step 2: Add a global error handler in `src/index.ts`** (place after `app.use`, before routes)

```ts
import { AppError } from './errors';

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.status as any);
  }
  console.error('unhandled', err);
  return c.json({ error: 'upstream_error', message: 'Internal error' }, 500);
});
```

- [ ] **Step 3: Write failing test (append to `test/routes.test.ts`)**

```ts
import { AppError } from '../src/errors';

describe('AppError', () => {
  it('maps codes to status', () => {
    expect(new AppError('rate_limited', 'x').status).toBe(429);
    expect(new AppError('not_found', 'x').status).toBe(404);
  });
});
```

- [ ] **Step 4: Run test**

Run: `npm test -- test/routes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add AppError hierarchy and error handler"
```

---

## Task 5: HTTP helpers with 429 backoff

**Files:**
- Create: `src/http.ts`, add to `test/api.test.ts` later (covered in Task 7).

- [ ] **Step 1: Create `src/http.ts`**

```ts
import type { Fetcher } from './env';
import { AppError } from './errors';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET/POST with one retry on HTTP 429 using Retry-After (capped 3s). */
export async function fetchWithRetry(
  fetchImpl: Fetcher,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let res = await fetchImpl(url, init);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after')) || 1;
    await sleep(Math.min(retryAfter, 3) * 1000);
    res = await fetchImpl(url, init);
  }
  if (res.status === 429) {
    throw new AppError('rate_limited', 'Upstream rate limited');
  }
  return res;
}

export async function fetchText(fetchImpl: Fetcher, url: string, init?: RequestInit): Promise<string> {
  const res = await fetchWithRetry(fetchImpl, url, init);
  if (!res.ok) throw new AppError('upstream_error', `GET ${url} -> ${res.status}`);
  return res.text();
}

export async function fetchJson<T>(fetchImpl: Fetcher, url: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRetry(fetchImpl, url, init);
  if (!res.ok) throw new AppError('upstream_error', `${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}
```

- [ ] **Step 2: Write failing test `test/http.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry } from '../src/http';
import { AppError } from '../src/errors';

describe('fetchWithRetry', () => {
  it('retries once on 429 then succeeds', async () => {
    const calls: number[] = [];
    const fetchImpl = vi.fn(async () => {
      calls.push(1);
      return calls.length === 1
        ? new Response('', { status: 429, headers: { 'retry-after': '0' } })
        : new Response('ok', { status: 200 });
    });
    const res = await fetchWithRetry(fetchImpl as any, 'https://x');
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws rate_limited after second 429', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('', { status: 429, headers: { 'retry-after': '0' } }));
    await expect(fetchWithRetry(fetchImpl as any, 'https://x'))
      .rejects.toBeInstanceOf(AppError);
  });
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- test/http.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add http helpers with 429 backoff"
```

---

## Task 6: String helpers + Kodik token (with KV cache)

**Files:**
- Create: `src/kodik/strings.ts`, `src/kodik/token.ts`, `test/strings.test.ts`, `test/token.test.ts`, `test/fixtures/add-players.js`

- [ ] **Step 1: Create `src/kodik/strings.ts`**

```ts
/** Returns the substring between startMarker and the next endMarker, or null. */
export function extractBetween(text: string, startMarker: string, endMarker: string): string | null {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;
  const valueStart = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, valueStart);
  if (endIdx === -1) return null;
  return text.substring(valueStart, endIdx);
}
```

- [ ] **Step 2: Write failing test `test/strings.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { extractBetween } from '../src/kodik/strings';

describe('extractBetween', () => {
  it('extracts a token', () => {
    expect(extractBetween('var x=token="abc";', 'token="', '"')).toBe('abc');
  });
  it('returns null when missing', () => {
    expect(extractBetween('nope', 'token="', '"')).toBeNull();
  });
});
```

- [ ] **Step 3: Run test**

Run: `npm test -- test/strings.test.ts`
Expected: PASS.

- [ ] **Step 4: Create fixture `test/fixtures/add-players.js`**

```js
/* trimmed Kodik add-players script */
var a = {};a.token="d8a6c3e2f1b09887aabbccddeeff0011";a.domain="kodik";
```

- [ ] **Step 5: Write failing test `test/token.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { getKodikToken } from '../src/kodik/token';

const script = readFileSync(new URL('./fixtures/add-players.js', import.meta.url), 'utf8');

function kvStub(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (k: string) => map.get(k) ?? null),
    put: vi.fn(async (k: string, v: string) => void map.set(k, v)),
  } as any;
}

describe('getKodikToken', () => {
  it('uses KODIK_TOKEN env override without network', async () => {
    const fetchImpl = vi.fn();
    const env = { KODIK_TOKEN: 'manual', KODIK_KV: kvStub() } as any;
    expect(await getKodikToken(env, fetchImpl)).toBe('manual');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns cached token from KV without network', async () => {
    const fetchImpl = vi.fn();
    const env = { KODIK_KV: kvStub({ kodik_token: 'cached' }) } as any;
    expect(await getKodikToken(env, fetchImpl)).toBe('cached');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('parses token from the script and caches it', async () => {
    const kv = kvStub();
    const fetchImpl = vi.fn(async () => new Response(script, { status: 200 }));
    const env = { KODIK_KV: kv } as any;
    const token = await getKodikToken(env, fetchImpl);
    expect(token).toBe('d8a6c3e2f1b09887aabbccddeeff0011');
    expect(kv.put).toHaveBeenCalledWith('kodik_token', token, expect.anything());
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- test/token.test.ts`
Expected: FAIL (`getKodikToken` not defined).

- [ ] **Step 7: Create `src/kodik/token.ts`**

```ts
import type { Env, Fetcher } from '../env';
import { fetchText } from '../http';
import { extractBetween } from './strings';
import { AppError } from '../errors';

const TOKEN_SCRIPT_URL = 'https://kodik-add.com/add-players.min.js?v=2';
const KV_KEY = 'kodik_token';
const TTL_SECONDS = 60 * 60 * 12; // 12h

export async function getKodikToken(env: Env, fetchImpl: Fetcher = fetch): Promise<string> {
  if (env.KODIK_TOKEN) return env.KODIK_TOKEN;

  const cached = await env.KODIK_KV.get(KV_KEY);
  if (cached) return cached;

  const script = await fetchText(fetchImpl, TOKEN_SCRIPT_URL);
  const token =
    extractBetween(script, 'token="', '"') ?? extractBetween(script, 'token=', '"');
  if (!token) throw new AppError('token_error', 'Kodik token not found in script');

  const clean = token.startsWith('"') ? token.slice(1) : token;
  await env.KODIK_KV.put(KV_KEY, clean, { expirationTtl: TTL_SECONDS });
  return clean;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- test/token.test.ts`
Expected: PASS (all three).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: kodik token acquisition with KV cache"
```

---

## Task 7: Kodik API proxy (search / translations list)

**Files:**
- Create: `src/kodik/api.ts`, `test/api.test.ts`

- [ ] **Step 1: Write failing test `test/api.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { kodikApi } from '../src/kodik/api';

function kvStub() {
  const map = new Map<string, string>([['kodik_token', 'tok']]);
  return { get: async (k: string) => map.get(k) ?? null, put: async () => {} } as any;
}

describe('kodikApi', () => {
  it('posts token + params as form-encoded and returns json', async () => {
    let captured: { url: string; body: string } = { url: '', body: '' };
    const fetchImpl = vi.fn(async (url: string, init: any) => {
      captured = { url, body: String(init.body) };
      return new Response(JSON.stringify({ total: 1, results: [{ id: 'a' }] }), { status: 200 });
    });
    const env = { KODIK_KV: kvStub() } as any;
    const data = await kodikApi(env, 'search', { shikimori_id: '123' }, fetchImpl);
    expect(captured.url).toBe('https://kodik-api.com/search');
    expect(captured.body).toContain('token=tok');
    expect(captured.body).toContain('shikimori_id=123');
    expect((data as any).results[0].id).toBe('a');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/api.test.ts`
Expected: FAIL (`kodikApi` not defined).

- [ ] **Step 3: Create `src/kodik/api.ts`**

```ts
import type { Env, Fetcher } from '../env';
import { fetchJson } from '../http';
import { getKodikToken } from './token';

const KODIK_API_BASE = 'https://kodik-api.com';
const VALID = new Set(['search', 'list', 'translations']);

export async function kodikApi(
  env: Env,
  endpoint: 'search' | 'list' | 'translations',
  params: Record<string, string>,
  fetchImpl: Fetcher = fetch,
): Promise<unknown> {
  if (!VALID.has(endpoint)) throw new Error(`bad endpoint ${endpoint}`);
  const token = await getKodikToken(env, fetchImpl);
  const body = new URLSearchParams({ token, ...params });
  return fetchJson(fetchImpl, `${KODIK_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: kodik api proxy (search/list/translations)"
```

---

## Task 8: Stream extraction (the fragile unit)

This ports `getLink` from the reference parser to a single `extractStream()` using regex + `atob` (no cheerio, no `base-64`). It is the one place tied to Kodik's page shape; isolate it and test against captured fixtures.

**Files:**
- Create: `src/kodik/extract.ts`, `test/extract.test.ts`, `scripts/capture-fixtures.mjs`
- Create fixtures: `test/fixtures/player-serial.html`, `test/fixtures/player-script.js`, `test/fixtures/video-response.json`

- [ ] **Step 1: Create `scripts/capture-fixtures.mjs` (one-off real-data capture)**

```js
// Usage: node scripts/capture-fixtures.mjs <shikimoriId>
// Captures the player page + player script into test/fixtures for tests.
import { writeFileSync } from 'node:fs';

const id = process.argv[2] ?? '20'; // default: a known shikimori id
const TOKEN_URL = 'https://kodik-add.com/add-players.min.js?v=2';

const between = (t, a, b) => {
  const i = t.indexOf(a); if (i < 0) return null;
  const j = t.indexOf(b, i + a.length); return j < 0 ? null : t.slice(i + a.length, j);
};

const script = await (await fetch(TOKEN_URL)).text();
const token = (between(script, 'token="', '"') ?? between(script, 'token=', '"')).replace(/^"/, '');

const findUrl = encodeURIComponent(`https://kodikdb.com/find-player?shikimoriID=${id}`);
const getPlayer = `https://kodik-api.com/get-player?title=Player&hasPlayer=false&url=${findUrl}&token=${token}&shikimoriID=${id}`;
const meta = await (await fetch(getPlayer)).json();
if (!meta.found) throw new Error('not found for id ' + id);

const playerUrl = 'https:' + meta.link;
const html = await (await fetch(playerUrl)).text();
writeFileSync(new URL('../test/fixtures/player-serial.html', import.meta.url), html);

const scriptSrc = between(html, '<script type="text/javascript" src="', '"');
const playerScript = await (await fetch('https://kodikplayer.com' + scriptSrc)).text();
writeFileSync(new URL('../test/fixtures/player-script.js', import.meta.url), playerScript);

console.log('captured. scriptSrc =', scriptSrc);
```

Run it once: `node scripts/capture-fixtures.mjs`. Commit the produced fixtures. (If Kodik markup differs from the reference, this real capture is the source of truth — tune the regexes in Step 4 against it until tests pass.) Also create `test/fixtures/video-response.json` by copying the POST response printed during a manual run, OR hand-author it minimally as below.

- [ ] **Step 2: Create minimal `test/fixtures/video-response.json`** (used when real capture is unavailable)

```json
{ "links": { "360": [{ "src": "//cloud.kodik-storage.com/useruploads/abc/720p/mp4:hls:manifest.m3u8" }], "720": [{ "src": "//x" }] } }
```

Note: this fixture src already contains `mp4:hls:manifest.m3u8`, exercising the non-encrypted path. The encrypted path is covered by a unit test on `decryptUrl` in Step 5.

- [ ] **Step 3: Write failing test `test/extract.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractStream, decryptUrl, encryptForTest } from '../src/kodik/extract';

const html = readFileSync(new URL('./fixtures/player-serial.html', import.meta.url), 'utf8');
const playerScript = readFileSync(new URL('./fixtures/player-script.js', import.meta.url), 'utf8');
const videoResponse = readFileSync(new URL('./fixtures/video-response.json', import.meta.url), 'utf8');

function kvStub() {
  const map = new Map<string, string>([['kodik_token', 'tok']]);
  return { get: async (k: string) => map.get(k) ?? null, put: async () => {} } as any;
}

describe('decryptUrl', () => {
  it('round-trips a Caesar+base64 encoded manifest', () => {
    const plain = '//cloud.example/useruploads/x/720p/mp4:hls:manifest.m3u8';
    const encoded = encryptForTest(plain, 13);
    expect(decryptUrl(encoded)).toBe(plain);
  });
});

describe('extractStream', () => {
  it('returns manifest + qualities from fixtures', async () => {
    const env = { KODIK_KV: kvStub() } as any;
    // Route each upstream URL to the right fixture:
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/get-player')) {
        return new Response(JSON.stringify({ found: true, link: '//kodikplayer.com/serial/1/h/720p' }), { status: 200 });
      }
      if (url.includes('kodikplayer.com') && url.endsWith('.js')) {
        return new Response(playerScript, { status: 200 });
      }
      if (url.includes('kodikplayer.com') && url.includes('/serial/')) {
        return new Response(html, { status: 200 });
      }
      // the computed POST link (manifest request)
      return new Response(videoResponse, { status: 200 });
    });

    const result = await extractStream(
      env,
      { id: '20', idType: 'shikimori', episode: 1, translationId: '0' },
      fetchImpl,
    );
    expect(result.manifest).toContain('mp4:hls:manifest.m3u8');
    expect(result.qualities).toContain(720);
  });
});
```

- [ ] **Step 4: Create `src/kodik/extract.ts`**

```ts
import type { Env, Fetcher } from '../env';
import { fetchText, fetchJson } from '../http';
import { getKodikToken } from './token';
import { extractBetween } from './strings';
import { AppError } from '../errors';

const KODIK_API_BASE = 'https://kodik-api.com';
const KODIK_PLAYER_BASE = 'https://kodikplayer.com';
const KODIK_DB_BASE = 'https://kodikdb.com';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface StreamRequest {
  id: string;
  idType: 'shikimori' | 'kinopoisk' | 'imdb';
  episode: number;
  translationId: string; // '0' = default
}

export interface StreamResult {
  manifest: string;
  qualities: number[];
}

interface UrlParams { d: string; d_sign: string; pd: string; pd_sign: string; ref_sign: string; }

const ID_PARAM: Record<StreamRequest['idType'], string> = {
  shikimori: 'shikimoriID',
  kinopoisk: 'kinopoiskID',
  imdb: 'imdbID',
};

/** base64-decode to a binary string (atob is latin1, matches base-64 lib). */
function b64decode(s: string): string {
  return atob(s);
}

function decryptChar(char: string, shift: number): string {
  const isLower = char === char.toLowerCase();
  const idx = ALPHABET.indexOf(char.toUpperCase());
  if (idx === -1) return char;
  const shifted = ALPHABET[(idx + shift) % 26];
  return isLower ? shifted.toLowerCase() : shifted;
}

function tryDecrypt(encoded: string, shift: number): string | null {
  const rotated = Array.from(encoded).map((c) => decryptChar(c, shift)).join('');
  const padded = rotated + '='.repeat((4 - (rotated.length % 4)) % 4);
  try {
    const decoded = b64decode(padded);
    return decoded.includes('mp4:hls:manifest.m3u8') ? decoded : null;
  } catch {
    return null;
  }
}

export function decryptUrl(encoded: string): string {
  for (let shift = 0; shift < 26; shift++) {
    const r = tryDecrypt(encoded, shift);
    if (r) return r;
  }
  throw new AppError('extract_failed', 'Could not decrypt stream url');
}

/** Test-only helper: inverse of decrypt (Caesar shift + base64) for round-trip tests. */
export function encryptForTest(plain: string, shift: number): string {
  const b64 = btoa(plain).replace(/=+$/, '');
  return Array.from(b64).map((c) => decryptChar(c, (26 - shift) % 26)).join('');
}

async function fetchPlayerLink(env: Env, req: StreamRequest, fetchImpl: Fetcher): Promise<string> {
  const token = await getKodikToken(env, fetchImpl);
  const param = ID_PARAM[req.idType];
  const findUrl = encodeURIComponent(`${KODIK_DB_BASE}/find-player?${param}=${req.id}`);
  const url = `${KODIK_API_BASE}/get-player?title=Player&hasPlayer=false&url=${findUrl}&token=${token}&${param}=${req.id}`;
  const data = await fetchJson<{ found?: boolean; link?: string; error?: string }>(fetchImpl, url);
  if (data.error) throw new AppError('token_error', data.error);
  if (!data.found || !data.link) throw new AppError('not_found', `No player for ${req.idType} ${req.id}`);
  return 'https:' + data.link;
}

function extractUrlParams(html: string): UrlParams {
  const raw = extractBetween(html, "urlParams = '", "';");
  if (!raw) throw new AppError('extract_failed', 'urlParams not found');
  return JSON.parse(raw) as UrlParams;
}

/** Find the option matching translationId and build the per-episode player url. */
function resolveTranslationUrl(html: string, translationId: string, episode: number): string | null {
  // Each option: <option ... data-id="X" data-media-id="M" data-media-hash="H" ...>
  const optionRe = /<option\b[^>]*>/g;
  for (const m of html.matchAll(optionRe)) {
    const tag = m[0];
    const id = extractBetween(tag, 'data-id="', '"');
    if (id !== translationId) continue;
    const mediaId = extractBetween(tag, 'data-media-id="', '"');
    const mediaHash = extractBetween(tag, 'data-media-hash="', '"');
    if (!mediaId || !mediaHash) return null;
    const kind = episode !== 0 ? 'serial' : 'video';
    return `${KODIK_PLAYER_BASE}/${kind}/${mediaId}/${mediaHash}/720p?min_age=16&first_url=false&season=1&episode=${episode}`;
  }
  return null;
}

interface VideoInfo { type: string; hash: string; id: string; scriptUrl: string; }

/** Pull video type/hash/id from the inline script and the player script src. */
function extractVideoInfo(html: string): VideoInfo {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const inline = scripts.find((s) => s.includes('.hash =') && s.includes('.id =')) ?? '';
  const type = extractBetween(inline, ".type = '", "'");
  const hash = extractBetween(inline, ".hash = '", "'");
  const id = extractBetween(inline, ".id = '", "'");

  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g)].map((m) => m[1]);
  // The player script is the one whose path is absolute on the player origin.
  const scriptUrl = srcs.find((s) => s.startsWith('/assets') || s.includes('app')) ?? srcs[0] ?? '';

  if (!type || !hash || !id || !scriptUrl) {
    throw new AppError('extract_failed', 'video info not found');
  }
  return { type, hash, id, scriptUrl };
}

/** Decode the POST endpoint path embedded (base64) in the player script. */
async function getPostLink(scriptUrl: string, fetchImpl: Fetcher): Promise<string> {
  const data = await fetchText(fetchImpl, `${KODIK_PLAYER_BASE}${scriptUrl}`);
  const ajaxIdx = data.indexOf('$.ajax');
  if (ajaxIdx === -1) throw new AppError('extract_failed', '$.ajax not found');
  const encoded = data.substring(ajaxIdx + 30, data.indexOf('cache:!1') - 3);
  return b64decode(encoded);
}

export async function extractStream(
  env: Env,
  req: StreamRequest,
  fetchImpl: Fetcher = fetch,
): Promise<StreamResult> {
  const playerLink = await fetchPlayerLink(env, req, fetchImpl);
  let html = await fetchText(fetchImpl, playerLink);
  const urlParams = extractUrlParams(html);

  if (req.translationId !== '0') {
    const resolved = resolveTranslationUrl(html, req.translationId, req.episode);
    if (resolved) html = await fetchText(fetchImpl, resolved);
  }

  const info = extractVideoInfo(html);
  const postLink = await getPostLink(info.scriptUrl, fetchImpl);

  const params = new URLSearchParams({
    hash: info.hash, id: info.id, type: info.type,
    d: urlParams.d, d_sign: urlParams.d_sign,
    pd: urlParams.pd, pd_sign: urlParams.pd_sign,
    ref: '', ref_sign: urlParams.ref_sign,
    bad_user: 'true', cdn_is_working: 'true',
  });

  const data = await fetchJson<{ links: Record<string, Array<{ src: string }>> }>(
    fetchImpl, `${KODIK_PLAYER_BASE}${postLink}`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() },
  );

  const first = data.links?.['360']?.[0]?.src;
  if (!first) throw new AppError('extract_failed', 'no links in response');
  const raw = first.includes('mp4:hls:manifest.m3u8') ? first : decryptUrl(first);
  const manifest = raw.startsWith('http') ? raw : 'https:' + raw;
  const qualities = Object.keys(data.links).map((q) => parseInt(q, 10)).sort((a, b) => a - b);

  return { manifest, qualities };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/extract.test.ts`
Expected: PASS. `decryptUrl` round-trip passes immediately. If `extractStream` fails on `extractVideoInfo`/`getPostLink`, it means the captured fixtures differ from the regex assumptions — adjust the regexes in `extractVideoInfo`/`resolveTranslationUrl` to match the real captured `player-serial.html` until green. This tuning is expected and is exactly why fixtures are captured.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: kodik HLS stream extraction (regex port, no cheerio)"
```

---

## Task 9: Kodik routes

**Files:**
- Create: `src/routes/kodik.ts`
- Modify: `src/index.ts`
- Add tests to `test/routes.test.ts`

- [ ] **Step 1: Create `src/routes/kodik.ts`**

```ts
import { Hono } from 'hono';
import type { Env } from '../env';
import { AppError } from '../errors';
import { kodikApi } from '../kodik/api';
import { extractStream, type StreamRequest } from '../kodik/extract';

export const kodikRoutes = new Hono<{ Bindings: Env }>();

kodikRoutes.get('/search', async (c) => {
  const title = c.req.query('title');
  const id = c.req.query('id');
  const idType = c.req.query('id_type') ?? 'shikimori';
  if (!title && !id) throw new AppError('bad_request', 'title or id required');
  const params: Record<string, string> = { with_material_data: 'true', limit: '50' };
  if (title) params['title'] = title;
  if (id) params[`${idType}_id`] = id;
  return c.json(await kodikApi(c.env, 'search', params));
});

kodikRoutes.get('/translations', async (c) => {
  const id = c.req.query('id');
  const idType = c.req.query('id_type') ?? 'shikimori';
  if (!id) throw new AppError('bad_request', 'id required');
  // translations live in the search material; reuse search and let the client read them,
  // OR call the kodik list endpoint by id:
  return c.json(await kodikApi(c.env, 'search', { [`${idType}_id`]: id, with_material_data: 'true' }));
});

kodikRoutes.get('/stream', async (c) => {
  const id = c.req.query('id');
  const episode = Number(c.req.query('episode') ?? '1');
  const translationId = c.req.query('translation') ?? '0';
  const idType = (c.req.query('id_type') ?? 'shikimori') as StreamRequest['idType'];
  if (!id) throw new AppError('bad_request', 'id required');
  const result = await extractStream(c.env, { id, idType, episode, translationId });
  return c.json(result);
});
```

- [ ] **Step 2: Mount in `src/index.ts`** (after error handler)

```ts
import { kodikRoutes } from './routes/kodik';
app.route('/kodik', kodikRoutes);
```

- [ ] **Step 3: Add failing route test (append to `test/routes.test.ts`)**

```ts
import { vi } from 'vitest';

describe('GET /kodik/search', () => {
  it('400 without title or id', async () => {
    const res = await app.request('/kodik/search', {}, { ALLOWED_ORIGIN: 'https://pyw0w.github.io' } as any);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: Run test**

Run: `npm test -- test/routes.test.ts`
Expected: PASS (400 path needs no network).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: mount kodik routes"
```

---

## Task 10: Shikimori OAuth token exchange

**Files:**
- Create: `src/auth/shikimori.ts`, `src/routes/auth.ts`, `test/auth.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing test `test/auth.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { exchangeCode, refreshToken } from '../src/auth/shikimori';

const env = {
  SHIKIMORI_CLIENT_ID: 'cid',
  SHIKIMORI_CLIENT_SECRET: 'secret',
  SHIKIMORI_REDIRECT_URI: 'https://pyw0w.github.io/oauth/callback',
} as any;

describe('exchangeCode', () => {
  it('posts authorization_code grant and returns tokens', async () => {
    let body = '';
    const fetchImpl = vi.fn(async (_url: string, init: any) => {
      body = String(init.body);
      return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 86400 }), { status: 200 });
    });
    const out = await exchangeCode(env, 'the_code', fetchImpl);
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code=the_code');
    expect(body).toContain('client_secret=secret');
    expect(out.access_token).toBe('a');
  });
});

describe('refreshToken', () => {
  it('posts refresh_token grant', async () => {
    let body = '';
    const fetchImpl = vi.fn(async (_url: string, init: any) => {
      body = String(init.body);
      return new Response(JSON.stringify({ access_token: 'a2', refresh_token: 'r2', expires_in: 86400 }), { status: 200 });
    });
    const out = await refreshToken(env, 'old_refresh', fetchImpl);
    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('refresh_token=old_refresh');
    expect(out.access_token).toBe('a2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/auth.test.ts`
Expected: FAIL (functions not defined).

- [ ] **Step 3: Create `src/auth/shikimori.ts`**

```ts
import type { Env, Fetcher } from '../env';
import { fetchJson } from '../http';

const TOKEN_URL = 'https://shikimori.io/oauth/token';

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export function exchangeCode(env: Env, code: string, fetchImpl: Fetcher = fetch): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.SHIKIMORI_CLIENT_ID,
    client_secret: env.SHIKIMORI_CLIENT_SECRET,
    code,
    redirect_uri: env.SHIKIMORI_REDIRECT_URI,
  });
  return fetchJson<TokenSet>(fetchImpl, TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

export function refreshToken(env: Env, refresh: string, fetchImpl: Fetcher = fetch): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: env.SHIKIMORI_CLIENT_ID,
    client_secret: env.SHIKIMORI_CLIENT_SECRET,
    refresh_token: refresh,
  });
  return fetchJson<TokenSet>(fetchImpl, TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/routes/auth.ts`**

```ts
import { Hono } from 'hono';
import type { Env } from '../env';
import { AppError } from '../errors';
import { exchangeCode, refreshToken } from '../auth/shikimori';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/shikimori/token', async (c) => {
  const body = await c.req.json<{ code?: string; refresh_token?: string }>().catch(() => ({}));
  if (body.code) return c.json(await exchangeCode(c.env, body.code));
  if (body.refresh_token) return c.json(await refreshToken(c.env, body.refresh_token));
  throw new AppError('bad_request', 'code or refresh_token required');
});
```

- [ ] **Step 6: Mount in `src/index.ts`**

```ts
import { authRoutes } from './routes/auth';
app.route('/auth', authRoutes);
```

- [ ] **Step 7: Add route test (append to `test/routes.test.ts`)**

```ts
describe('POST /auth/shikimori/token', () => {
  it('400 without code or refresh_token', async () => {
    const res = await app.request('/auth/shikimori/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, { ALLOWED_ORIGIN: 'https://pyw0w.github.io' } as any);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 8: Run full suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: shikimori oauth token exchange route"
```

---

## Task 11: Deploy config, secrets, README

**Files:**
- Create: `README.md`
- Cloud: KV namespace + secrets

- [ ] **Step 1: Create KV namespace and paste id into `wrangler.jsonc`**

Run: `npx wrangler kv namespace create KODIK_KV`
Copy the printed `id` into `wrangler.jsonc` → `kv_namespaces[0].id`.

- [ ] **Step 2: Set production secrets**

```bash
npx wrangler secret put SHIKIMORI_CLIENT_ID
npx wrangler secret put SHIKIMORI_CLIENT_SECRET
```

(Register the app at https://shikimori.io/oauth → redirect URI `https://pyw0w.github.io/oauth/callback`, scopes `user_rates`.)

- [ ] **Step 3: Create `README.md`**

````markdown
# anime-proxy

Cloudflare Worker (Hono) proxying Kodik + Shikimori OAuth exchange for the
anime PWA. See `docs` in the frontend repo for the design spec.

## Endpoints
- `GET /kodik/search?title=|id=&id_type=shikimori`
- `GET /kodik/translations?id=&id_type=shikimori`
- `GET /kodik/stream?id=&episode=&translation=&id_type=shikimori` → `{ manifest, qualities }`
- `POST /auth/shikimori/token` body `{ code }` or `{ refresh_token }`

## Dev
```bash
npm install
cp .dev.vars.example .dev.vars   # fill secrets
npm run dev
npm test
```

## Deploy
```bash
npx wrangler kv namespace create KODIK_KV   # once; paste id into wrangler.jsonc
npx wrangler secret put SHIKIMORI_CLIENT_ID
npx wrangler secret put SHIKIMORI_CLIENT_SECRET
npm run deploy
```
````

- [ ] **Step 4: Deploy and smoke-test**

Run: `npm run deploy`
Then: `curl https://anime-proxy.<subdomain>.workers.dev/health` → `{"ok":true}`
Then: `curl "https://anime-proxy.<subdomain>.workers.dev/kodik/search?title=naruto" -H "Origin: https://pyw0w.github.io"` → JSON results.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: add README and deploy config"
```

---

## Self-Review (Worker plan)

- **Spec coverage:** `/kodik/search` (T9), `/kodik/translations` (T9), `/kodik/stream` extraction without cheerio (T8), `/auth/shikimori/token` (T10), CORS single-origin (T3), KV token cache (T6), 429 backoff (T5), error layer (T4), fixtures-based extraction tests (T8). All spec §5/§7/§9 items covered.
- **Note on `/translations`:** Kodik returns translations inside `material_data`/search results; T9 reuses `search` by id and the frontend reads the translation list from it. If a dedicated translation list is later needed, add a `kodikApi(env,'translations',…)` call — the proxy already supports that endpoint.
- **Risk:** T8 regex selectors depend on real Kodik markup; the capture script + fixture tuning step is the mitigation. Contract (`extractStream → {manifest,qualities}`) is stable regardless.
