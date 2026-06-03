# Anime PWA — Design Spec

- **Date:** 2026-06-03
- **Status:** Approved (design), pending implementation plan
- **Frontend repo:** `pyw0w.github.io` (GitHub Pages)
- **Backend repo:** separate — `anime-proxy` (Cloudflare Workers)

## 1. Purpose

PWA для просмотра аниме: каталог и поиск через Shikimori, вход и личные
списки через Shikimori OAuth, воспроизведение видео через собственный плеер
(hls.js) с потоком, извлекаемым из Kodik через свой прокси.

## 2. Sources & key findings

- **Shikimori** (`https://shikimori.io`) — CORS открыт, браузерный User-Agent
  принимается. Каталог/поиск/тайтл — публичный API; списки и отметки — с
  `Bearer`. Вызывается **напрямую из браузера**.
- **Kodik** — вызывается **только через Worker** (там токен и логика
  извлечения). Подтверждено из `aerosstube/anime-kodik-parser`:
  - Токен парсится строкой из `https://kodik-add.com/add-players.min.js?v=2`.
  - API: `POST https://kodik-api.com/{search|list|translations}` c `{token,...}`.
  - Извлечение потока: `kodikdb.com/find-player` → страница плеера → вытащить
    `urlParams` (base64 c `d/d_sign/pd/pd_sign/ref_sign`) + `.hash/.id/.type`
    из скрипта → POST на вычисляемый эндпоинт → base64-декод → `...mp4:hls:manifest.m3u8`.
  - Всё извлечение — строки + base64 + fetch, **cheerio не обязателен** →
    портируется на Cloudflare Workers.
- **Референс** `AN0NCER/an0ncer.github.io` — статический фронт + Cloudflare
  Worker `kodik-proxy` + собственный сервер «tunime». Подтверждает выбранную
  схему «фронт-статика + тонкий Worker».

## 3. Architecture

Две независимо деплоящиеся части:

```
┌──────────────────────────┐         ┌──────────────────────────┐
│ PWA-фронт (GitHub Pages)  │         │ Hono Worker (Cloudflare)  │
│ Vite + React              │         │ anime-proxy               │
│                           │──CORS──▶│  /kodik/search            │
│ • Каталог/поиск/тайтл     │         │  /kodik/translations      │
│ • OAuth-флоу Shikimori    │         │  /kodik/stream → m3u8     │
│ • Свой плеер (hls.js)     │         │  /auth/shikimori/token    │
│ • Service worker / PWA    │         └────────────┬─────────────┘
└───────────┬───────────────┘   secret: KODIK token,│
            │ напрямую (CORS)      SHIKIMORI_CLIENT_SECRET
            ▼                                        ▼
   shikimori.io/api (каталог, списки)     kodik-api.com / kodikdb.com
```

- Shikimori — напрямую с фронта.
- Kodik — только через Worker.
- OAuth token exchange — через Worker (прячем `client_secret`).

## 4. Frontend (Vite + React)

**Design system:** фронтенд ведётся через скилл **design-taste-frontend**
(реальная дизайн-система, анти-шаблонность, audit-first). Это обязательное
требование: визуальный язык, типографика, цвет, spacing, состояния и
компоненты проектируются по этому скиллу на этапе реализации фронта, а не
по дефолтному UI-китовому шаблону.

- **Роутинг** (react-router): `/` (главная/каталог), `/search`,
  `/anime/:id` (тайтл + эпизоды + плеер), `/login`, `/oauth/callback`,
  `/lists`, `/settings`.
- **Структура**: `src/api/` (клиенты shikimori/worker), `src/features/`
  (catalog, anime, player, auth, lists), `src/components/` (UI),
  `src/store/` (Zustand), `src/pwa/`.
- **Серверное состояние**: TanStack Query (кэш, ретраи, дедуп).
- **Плеер**: компонент `<Player>` на `hls.js` (+ нативный HLS в Safari),
  источник — m3u8 из `/kodik/stream`; контролы, выбор озвучки/серии,
  сохранение позиции в localStorage.
- **PWA**: `vite-plugin-pwa` (Workbox). Precache аппшелла; runtime-кэш
  постеров и Shikimori-ответов (stale-while-revalidate); манифест + иконки +
  установка. Видео-сегменты **не** кэшируем.

## 5. Worker (Hono на Cloudflare)

Эндпоинты:

- `GET /kodik/search?title=…&id=…&id_type=shikimori` → прокси к
  `kodik-api.com`; токен из секрета, кэш/авто-обновление в **KV**.
- `GET /kodik/translations?id=…` → список озвучек/серий.
- `GET /kodik/stream?id=…&episode=…&translation=…` → порт логики извлечения
  (find-player → parse `urlParams`+`hash/id/type` → POST → base64-декод) →
  `{ manifest: "...m3u8", qualities }`. Без cheerio (regex/строки).
- `POST /auth/shikimori/token` → обмен `code`→`access`+`refresh` и `refresh`
  (хранит `SHIKIMORI_CLIENT_SECRET`).

Прочее: CORS только для origin GitHub Pages; токен Kodik в KV;
обработка 429 (бэкофф). Логика извлечения изолирована в модуле
`kodik/extract.ts` с явным контрактом.

## 6. Shikimori OAuth (Authorization Code)

1. Фронт → `shikimori.io/oauth/authorize?client_id…&redirect_uri=/oauth/callback`.
2. Callback c `code` → Worker `/auth/shikimori/token` → `access`+`refresh`.
3. Токены в localStorage; авто-`refresh` по истечении.
4. Каталог/поиск/тайтл — публичный API (GraphQL); списки и отметки
   «смотрю/посмотрел» — REST `/api/v2/user_rates` с `Bearer`.

## 7. Kodik integration & risk

- Маппинг Shikimori-тайтла → Kodik по `shikimori_id` (`id_type=shikimori`).
- Worker отдаёт m3u8, фронт играет в hls.js.
- **Risk:** извлечение потока завязано на вёрстку/подпись Kodik — может
  сломаться. **Mitigation:** изоляция в `kodik/extract.ts` с контрактом;
  на ошибку извлечения — понятное сообщение в плеере. iframe-фолбэк
  сознательно не делаем (выбран свой плеер).

## 8. Errors & data

- Единый слой ошибок: сетевые / 429 / невалидный токен / «поток не найден»
  → понятные сообщения, ретрай где уместно.
- Прогресс просмотра/история — localStorage (синк со списками Shikimori — вне MVP).

## 9. Testing

- **Worker**: юнит-тесты извлечения на сохранённых HTML-фикстурах Kodik
  (Vitest) — ловим поломку парсинга; тесты CORS/ошибок.
- **Frontend**: юнит на api-клиентах и OAuth-логике (мок fetch);
  компонентные тесты плеера (мок hls.js). E2E — вне MVP.

## 10. MVP scope

- Поиск и каталог (Shikimori).
- Просмотр через собственный плеер (hls.js) + Worker-извлечение Kodik.
- OAuth и списки Shikimori.
- PWA: оффлайн-аппшелл / установка.

## 11. Out of scope (YAGNI)

Офлайн-скачивание видео, собственный бэкенд-аккаунт/синк устройств,
комментарии/соцфичи, SSR, рекомендации, расписание. — последующие итерации.
