# GulpAnime — Design Spec

**Дата:** 2026-05-30
**Статус:** Черновик

## 1. Концепция

Аниме-сайт для просмотра онлайн. Гибрид каталога и плеера на Vanilla JS + Gulp, с PWA-возможностями через `pwa.core.js`. Видео через Kodik API с Hono-прокси, который извлекает прямые ссылки на видео (m3u8) вместо iframe. Автоматическая тёмная/светлая тема под системные настройки.

**MVP (первая версия):** каталог аниме + PWA/офлайн. Плеер добавляется позже.

## 2. Стек технологий

- **Фронтенд:** Vanilla JS (ES modules)
- **Сборка:** Gulp (SCSS → CSS, минификация, конкатенация, HTML-инклуды)
- **PWA:** PWA Core (pwa.core.js + worker.js) — SW регистрация, кэширование, офлайн
- **Видео:** Kodik API через Hono-прокси (Cloudflare Worker) с парсером прямых ссылок
- **Плеер:** HLS.js для m3u8 + кастомный UI
- **Тема:** CSS custom properties + `prefers-color-scheme` (auto)
- **Анимации:** CSS transitions (без библиотек)
- **Иконки:** SVG-спрайты

## 3. Архитектура

### 3.1 Прокси-сервер (отдельный репозиторий + git submodule)

Hono.js (Cloudflare Worker) — проксирует запросы к Kodik, скрывает API-ключ, парсит iframe для получения прямых ссылок.

Прокси живёт в своём репозитории и подключается сюда как git submodule в `proxy/`.

**Эндпоинты:**
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/list` | Список всех тайтлов (прокси Kodik list) |
| GET | `/search?q=...` | Поиск по названию |
| GET | `/player?id=...` | Парсинг iframe → прямая ссылка на видео |

### 3.2 Клиент (этот проект)

Гибридный подход:

- **Старт как MPA** — Gulp генерирует HTML-страницы из `src/pages/`
- **Прогрессивное улучшение** — JS добавляет:
  - Плавную навигацию (pjax/fetch + History API)
  - Поиск и фильтрацию без перезагрузки
  - Динамическую загрузку данных через Kodik-прокси
  - PWA (Service Worker, офлайн, установка)

### 3.3 Схема данных

```
Kodik API → Hono-прокси (Cloudflare Worker) → Gulp build (catalog.json) → dist/
           ↘ Hono-прокси ← браузер (поиск/фильтрация/плеер в runtime)
```

## 4. Структура проекта

```
GulpAnime/
├── src/
│   ├── pages/
│   │   ├── index.html           # Главная (слайдер/топ)
│   │   ├── catalog.html         # Каталог с поиском/фильтрами
│   │   └── anime.html           # Страница аниме (детали + плеер)
│   ├── includes/                # HTML-инклуды (header, footer, nav)
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── main.scss        # Основной файл
│   │   │   ├── _variables.scss  # CSS-переменные (темы)
│   │   │   ├── _reset.scss      # Сброс стилей
│   │   │   ├── _layout.scss     # Сетка, карточки
│   │   │   └── _components.scss # UI-компоненты
│   │   └── scripts/
│   │       ├── app.js           # Точка входа, инициализация
│   │       ├── router.js        # Навигация (pjax)
│   │       ├── api.js           # Клиент для Hono-прокси
│   │       ├── search.js        # Поиск и фильтрация
│   │       ├── theme.js         # Переключение темы
│   │       ├── player.js        # HLS.js плеер
│   │       └── utils.js         # Хелперы
│   ├── data/
│   │   └── catalog.json         # Кэш каталога (генерируется gulp data)
│   └── sw/
│       ├── pwa.core.js          # PWA Core (копируется в dist/)
│       └── worker.js            # Service Worker (копируется в dist/)
├── proxy/                        # Git submodule — Hono-прокси (отдельный репозиторий)
├── dist/                        # Собранный сайт
├── gulpfile.js                  # Конфигурация Gulp
├── package.json
└── .gitignore
```

## 5. Gulp-пайплайн

| Таск | Описание |
|------|----------|
| `gulp styles` | SCSS → CSS, autoprefixer, clean-css → `dist/assets/css/` |
| `gulp scripts` | JS-модули (конкатенация), babel, uglify → `dist/assets/js/` |
| `gulp html` | HTML-инклуды через `gulp-file-include`, minify → `dist/` |
| `gulp assets` | Копирование шрифтов, изображений, SVG |
| `gulp pwa` | Копирование pwa.core.js + worker.js → `dist/` |
| `gulp data` | Fetch к Hono-прокси → сохранение `catalog.json` |
| `gulp build` | series(styles, scripts, html, assets, pwa, data) |
| `gulp watch` | Наблюдение + browser-sync (livereload) |

**npm-зависимости:**
`gulp`, `gulp-sass`, `gulp-autoprefixer`, `gulp-clean-css`, `gulp-babel`, `gulp-concat`, `gulp-uglify`, `gulp-htmlmin`, `gulp-file-include`, `browser-sync`, `@babel/core`, `@babel/preset-env`

## 6. PWA (pwa.core.js)

- SW регистрируется через `pwa.core.js` при загрузке
- Кэширование: страницы, CSS, JS, шрифты, catalog.json
- Офлайн-режим: каталог доступен без интернета
- Версионирование: при обновлении SW — уведомление о новой версии
- Установка на домашний экран (manifest.json)

### manifest.json
```json
{
  "name": "GulpAnime",
  "short_name": "GA",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "background_color": "#0d0d0d"
}
```

### worker.js (app shell кэширование)
- cacheName: `pwa-sw-{hash}-v{version}`
- appShellFilesToCache: index.html, catalog.html, anime.html, assets/**
- Fetch handler: cache-first для статики, network-first для данных

## 7. Визуальный стиль

- **Тема:** Автоматическая (system preference) через `@media (prefers-color-scheme)`
- **Тёмная тема:** `--bg: #0d0d0d`, `--surface: #1a1a2e`, `--accent: #0071e3` (синий)
- **Светлая тема:** `--bg: #f5f5f7`, `--surface: #ffffff`, `--accent: #0071e3`
- **Шрифт:** system-ui (без загрузки шрифтов)
- **Иконки:** SVG-спрайты (встроенные)

## 8. Компоненты (MVP)

### 8.1 Главная (index.html)
- Хидер с логотипом и строкой поиска
- Секция "Популярное" (слайдер/сетка карточек)
- Секция "Последние добавленные"
- Футер

### 8.2 Каталог (catalog.html)
- Строка поиска (по мере ввода — результаты)
- Фильтры: жанр, год, статус (выходит/вышел)
- Сетка карточек аниме (постер, название, год, рейтинг)
- Пагинация (load more / бесконечная прокрутка)

### 8.3 Карточка аниме
- Постер
- Название (русское, оригинальное)
- Год, жанры, рейтинг
- Кнопка "Смотреть" (заглушка до MVP плеера)
- Кнопка "В избранное" (localStorage)

### 8.4 Избранное
- Список сохранённых тайтлов (localStorage)
- Страница `/favorites` или модалка

## 9. Data flow

### Сборка (build-time)
1. `gulp data` → fetch `GET /list` с Hono-прокси → все тайтлы → `src/data/catalog.json`
2. `gulp html` → использует `catalog.json` для генерации HTML-страниц
3. SW кэширует catalog.json для офлайн-доступа

### Runtime
1. Поиск/фильтрация → `GET /search?q=...` через Hono-прокси
2. Детали аниме → `GET /player?id=...` для получения прямой ссылки (m3u8)
3. Плеер → HLS.js воспроизводит m3u8

## 10. План по MVP

1. Настройка проекта: package.json, gulpfile.js, SCSS структура
2. PWA Core: копирование pwa.core.js, настройка worker.js, manifest.json
3. Главная страница: шаблон index.html, стили, карточки
4. Каталог: catalog.html, поиск, фильтры, пагинация
5. Страница аниме: anime.html, детали, избранное
6. Тема: CSS-переменные, auto-переключение
7. Gulp: стили, скрипты, html, data, build, watch

## 11. Критерии готовности MVP

- [x] Каталог отображает список аниме из Kodik (через прокси)
- [x] Работает поиск по названию
- [x] Работают фильтры (жанр, год)
- [x] Страница аниме с деталями
- [x] Избранное сохраняется в localStorage
- [x] PWA: установка, офлайн-каталог
- [x] Тёмная/светлая тема (системная)
- [x] Gulp: `gulp build` собирает проект, `gulp watch` для разработки
