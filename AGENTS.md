# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project
`pyw0w.github.io` (package name `anime-vost-player-react`) is a React + MUI + TypeScript SPA for an anime catalog/player ("AV Player"), built with Vite and deployed to GitHub Pages. There is **no backend**: the `backend/` directory only contains empty placeholder folders. All data is either baked into a static snapshot at build time or fetched directly from upstream APIs from the browser. The user-facing UI is in Russian.

## Common commands
- `npm install` — install dependencies (Node 24 in CI; any recent LTS works locally).
- `npm run dev` — syncs the catalog snapshot, regenerates the changelog, then starts Vite on `0.0.0.0:4173`. The two sync steps make network calls to AnimeTop/AniDub; skip them with `npx vite` if the snapshot already exists.
- `npm run build` — runs `prebuild` (same sync steps as `dev`), then `vite build`, then `scripts/postbuild-routes.mjs` to prerender static HTML shells.
- `npm run preview` — serves the production `dist/` on port 4173.
- `npm run typecheck` — `tsc --noEmit`. This is the **only** static analysis the project has; there is no ESLint/Prettier config and no test runner. CI runs `typecheck` before `build`.
- `npm run sync:catalog` — refresh `public/data/catalog.json` + `public/data/titles/*.json` from the upstream APIs on its own.
- `npm run generate:changelog` — refresh `public/data/changelog.json` from local git history; it calls `git describe --tags` and `git log`, so a shallow clone may lose entries (CI uses `fetch-depth: 50`, `fetch-tags: true`).

Generated data files (`public/data/catalog.json`, `public/data/changelog.json`, `public/data/titles/`) are gitignored. Fresh clones must run `sync:catalog` + `generate:changelog` (or just `npm run dev`) before the app has anything to render.

## Architecture overview
### Feature-Sliced layout under `src/`
- `src/app/` — app shell: `providers/AppProviders.tsx` (TanStack Query client + MUI theme), `router.tsx` (lazy-loaded routes with `basename` derived from `import.meta.env.BASE_URL`), `layout/AppLayout.tsx` (top bar + changelog chip), `theme.ts`.
- `src/entities/catalog.ts` — canonical domain types (`CatalogTitle`, `CatalogTitleSource`, `CatalogSnapshot`, `TitleDetail`, `PlaylistEpisode`, `CatalogParams`, `CatalogResult`). Zod schemas that validate these live next to them in `src/shared/api/catalog.ts`.
- `src/features/{home,search,favorites,history,changelog,title}/` — one page component per feature, each imported lazily by the router.
- `src/shared/` — reusable layer: `api/` (catalog + changelog fetchers and pure selectors), `ui/` (`PageShell`, `TitleGrid`, etc.), `lib/` (`routes.ts`, `text.ts` DOMPurify-based sanitizer, `useDebouncedValue.ts`), `storage/local.ts` (versioned localStorage + `useSyncExternalStore` hooks), `analytics/events.ts` (window `CustomEvent` dispatcher).

Existing imports use relative paths (`../../shared/...`). The `@/*` → `src/*` alias is configured in `tsconfig.json` and `vite.config.ts` but is not used in the codebase; stay consistent with relative paths unless intentionally migrating.

### Two-tier data flow (this is the key concept)
1. **Build-time snapshot.** `scripts/sync-catalog.mjs` fetches every page of `https://api.animetop.info/v1/last` and the full `https://isekai.anidub.fun/mobile-api.php?name=search&story=` listing, normalizes both into a common shape, merges duplicates using the canonical key `(originalTitle | year | type)` (see `buildCanonicalMergeKey`), and writes:
   - `public/data/catalog.json` — full merged catalog + precomputed filters (`genres`, `years`, `types`, `statuses`) and trending scores.
   - `public/data/titles/<canonicalId>.json` — per-title payload for AniDub sources (description + embedded player URL, validated against `TRUSTED_ANIDUB_PLAYER_HOSTS`). AnimeTop titles do not get a static file; their details are fetched live.
2. **Runtime.** `src/shared/api/catalog.ts` fetches `catalog.json` once (memoized via `snapshotPromise`) and does all search, filtering, sorting, pagination, related-title scoring, and home-feed selection in memory. For `getTitleDetail`/`getPlaylist`: AnimeTop goes to `api.animetop.info/v1/{info,playlist}` with `application/x-www-form-urlencoded` POST bodies; AniDub reads the static per-title JSON. Both schemas are validated with Zod.

When adding fields to a title, update (a) the scraper normalizer in `sync-catalog.mjs`, (b) the TypeScript type in `src/entities/catalog.ts`, and (c) the Zod schema in `src/shared/api/catalog.ts` — these three must stay in lockstep.

### Title IDs and routing
Canonical title IDs are `animetop-<n>` or `anidub-<n>`; merged entries keep their primary source's id. Routes, defined in `src/app/router.tsx` and parsed in `src/shared/lib/routes.ts`:
- `/title/:slug--:id` — canonical.
- `/title/:sourceId/:slug--:id` — source-pinned (`animetop` or `anidub`), used to force a specific player.
- `/title/<slug>-<number>` — legacy AnimeTop-only URL, auto-rewritten to `animetop-<number>`.

Use `titlePath(title)` from `src/shared/lib/routes.ts` when building internal links; do not hand-build `/title/...` strings.

### Local storage (v3)
`src/shared/storage/local.ts` stores favorites, view history, last-watched episode (keyed `titleId:sourceId`), and preferred source id per title under `av-player:*` keys. Each value is wrapped as `{ version, value }`; migration functions (`migrateFavorites`, `migrateHistory`, `migrateEpisodes`) handle v1 (pre-multi-source, numeric ids) and v2 payloads. Bump `STORAGE_VERSION` and add a migration if you change any of these shapes. Reading/writing goes through `useFavorites` / `useHistory` hooks (backed by `useSyncExternalStore`) or the exported imperative helpers; never touch `window.localStorage` directly.

### Security constraints (non-obvious)
- Every untrusted HTML description must go through `sanitizeHtml` from `src/shared/lib/text.ts` (DOMPurify with a tiny allow-list) before being passed to `dangerouslySetInnerHTML`.
- Iframe `src` values must be funneled through `getTrustedEmbedUrl` in `src/features/title/TitlePage.tsx`, which enforces HTTPS + an allowlist (`isekai.anidub.fun`, `player.ladonyvesna2005.info`). Mirror any allowlist change in `TRUSTED_ANIDUB_PLAYER_HOSTS` inside `scripts/sync-catalog.mjs` so unsafe URLs are dropped at snapshot time too.

### GitHub Pages deployment
- `vite.config.ts` computes `base` from `GITHUB_REPOSITORY`: `/<repo>/` for project pages, `/` for the `<user>.github.io` user page. `GITHUB_PAGES=true` is set only in CI.
- `public/404.html` is a SPA fallback: it stashes the requested path in `sessionStorage['spa-redirect']` and redirects to the app root; `src/main.tsx` consumes that entry and replays the URL via `history.replaceState`. Any client-side route must either exist in the router or have a prerendered shell, or GitHub Pages will hit this fallback.
- `scripts/postbuild-routes.mjs` copies `404.html`, injects `<link rel="preload">` for `catalog.json` and the hero poster + `preconnect`/`dns-prefetch` for image origins (`static.openni.ru`, `isekai.anidub.fun`), and prerenders static HTML shells for the top-level routes plus the first 120 titles (both canonical and source-prefixed variants).
- `.github/workflows/deploy-pages.yml` deploys on push to `main`, on `workflow_dispatch`, and on cron `0 21 * * *` UTC (00:00 Moscow) so the catalog snapshot refreshes daily.

## Conventions
- TypeScript strict mode is on; `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` will fail the typecheck.
- Pages use the shared `PageShell` wrapper for title/subtitle/loading banner consistency.
- React Query defaults (set in `AppProviders`) are `staleTime: 10m`, `gcTime: 1h`, `retry: 1`, no refetch on focus — match these expectations when adding new queries rather than overriding them ad hoc.
- UI strings are in Russian; keep new copy consistent with the existing tone.
