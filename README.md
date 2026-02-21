# pyw0w Portfolio

Личный сайт-визитка на `React + Vite` для GitHub Pages.

## Локальный запуск

```bash
npm install
npm run sync:projects
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

## Синхронизация проектов

Скрипт получает репозитории из GitHub API, фильтрует их и пишет кэш в `src/data/cache/projects.json`.

```bash
GITHUB_USERNAME=pyw0w npm run sync:projects
```

Опционально можно передать токен для более высоких лимитов API:

```bash
GITHUB_USERNAME=pyw0w GITHUB_TOKEN=ghp_xxx npm run sync:projects
```

## Деплой

В репозитории настроен workflow `.github/workflows/pages.yml`:
- на каждый push в `main` запускается синк проектов;
- выполняется сборка Vite;
- артефакт публикуется в GitHub Pages.
