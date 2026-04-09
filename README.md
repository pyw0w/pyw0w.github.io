# pyw0w.github.io

React + MUI + TypeScript версия публичного anime-каталога и плеера, подготовленная для деплоя на GitHub Pages.

## Стек
- React
- TypeScript
- Vite
- MUI
- TanStack Query
- Zod

## Локальный запуск
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
```

## Что есть в v1
- Home с hero, новинками и трендами
- Search как единый каталог с фильтрами и сортировкой
- Favorites
- History
- Страница тайтла с плеером и эпизодами
- Prerender и `404.html` fallback для GitHub Pages

## Деплой
Проект настроен на деплой через GitHub Actions в GitHub Pages (`.github/workflows/deploy-pages.yml`). Snapshot каталога пересобирается при каждом деплое и по расписанию каждый день в 00:00 по Москве.
