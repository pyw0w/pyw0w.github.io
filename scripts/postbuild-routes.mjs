import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = join(rootDir, 'dist');
const catalogPath = join(rootDir, 'public', 'data', 'catalog.json');
const indexPath = join(distDir, 'index.html');
const source404Path = join(rootDir, 'public', '404.html');
const dist404Path = join(distDir, '404.html');

async function ensureFileCopy(from, to) {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function injectMeta(template, title, description = 'Современный каталог аниме с новинками, поиском, избранным и встроенным плеером.') {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  return template
    .replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(/<meta property="og:title" content=".*?"\s*\/>/i, `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description" content=".*?"\s*\/>/i, `<meta property="og:description" content="${safeDescription}" />`)
    .replace(/<meta name="description" content=".*?"\s*\/>/i, `<meta name="description" content="${safeDescription}" />`)
    .replace(/<meta property="og:type" content=".*?"\s*\/>/i, '<meta property="og:type" content="website" />');
}

async function buildStaticShellRoutes(template) {
  const routes = [
    ['', 'AV Player — каталог аниме', 'Современный каталог аниме с новинками, поиском, избранным и встроенным плеером.'],
    ['search', 'Search — AV Player', 'Единый каталог аниме с поиском, фильтрами и сортировкой.'],
    ['favorites', 'Favorites — AV Player', 'Локальное избранное без аккаунтов.'],
    ['history', 'History — AV Player', 'Недавно открытые тайтлы в локальной истории браузера.'],
    ['changelog', 'Changelog — AV Player', 'Версия сайта и последние изменения из git-репозитория.'],
  ];

  await Promise.all(
    routes.map(async ([route, title, description]) => {
      const routeDir = route ? join(distDir, route) : distDir;
      await mkdir(routeDir, { recursive: true });
      await writeFile(join(routeDir, 'index.html'), injectMeta(template, title, description));
    }),
  );
}

async function buildTitleRoutes(template) {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const prerenderTargets = catalog.items.slice(0, 120);
  const routeEntries = [];

  for (const item of prerenderTargets) {
    routeEntries.push({
      routeDir: join(distDir, 'title', `${item.slug}--${item.id}`),
      title: `${item.title} — AV Player`,
      description: item.shortDescription,
    });

    const animeTopSource = (item.sources ?? []).find((source) => source.sourceId === 'animetop');
    if (animeTopSource) {
      routeEntries.push({
        routeDir: join(distDir, 'title', `${animeTopSource.legacySlug}-${animeTopSource.sourceTitleId}`),
        title: `${item.title} — AV Player`,
        description: item.shortDescription,
      });
    }

    for (const source of item.sources ?? []) {
      routeEntries.push({
        routeDir: join(distDir, 'title', source.sourceId, `${source.legacySlug}--${source.legacyTitleId}`),
        title: `${item.title} — AV Player`,
        description: item.shortDescription,
      });
    }
  }

  const seen = new Set();
  await Promise.all(
    routeEntries
      .filter((entry) => {
        if (seen.has(entry.routeDir)) return false;
        seen.add(entry.routeDir);
        return true;
      })
      .map(async (entry) => {
        await mkdir(entry.routeDir, { recursive: true });
        await writeFile(join(entry.routeDir, 'index.html'), injectMeta(template, entry.title, entry.description));
      }),
  );
}

async function main() {
  const template = await readFile(indexPath, 'utf8');
  await ensureFileCopy(source404Path, dist404Path);
  await buildStaticShellRoutes(template);
  await buildTitleRoutes(template);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
