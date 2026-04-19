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

function detectBasePath(template) {
  const match = template.match(/src="([^"]*\/)assets\//);
  return match ? match[1] : '/';
}

function injectCatalogPreload(template, basePath) {
  if (template.includes('rel="preload"') && template.includes('/data/catalog.json')) {
    return template;
  }
  const href = `${basePath}data/catalog.json`;
  const preload = `    <link rel="preload" as="fetch" type="application/json" crossorigin="anonymous" href="${href}" />\n  `;
  return template.replace(/(<\/head>)/i, `${preload}$1`);
}

const IMAGE_ORIGIN_HINTS = ['https://static.openni.ru', 'https://isekai.anidub.fun'];

function injectResourceHints(template) {
  const hints = IMAGE_ORIGIN_HINTS
    .filter((origin) => !template.includes(`href="${origin}"`))
    .map((origin) => `    <link rel="preconnect" href="${origin}" crossorigin />\n    <link rel="dns-prefetch" href="${origin}" />`)
    .join('\n');
  if (!hints) return template;
  return template.replace(/(<\/head>)/i, `${hints}\n  $1`);
}

function injectHeroPreload(template, heroPosterUrl) {
  if (!heroPosterUrl) return template;
  if (template.includes(`as="image"`) && template.includes(heroPosterUrl)) return template;
  const safeUrl = escapeHtml(heroPosterUrl);
  const preload = `    <link rel="preload" as="image" fetchpriority="high" href="${safeUrl}" />\n  `;
  return template.replace(/(<\/head>)/i, `${preload}$1`);
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

async function buildStaticShellRoutes(template, heroPosterUrl) {
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
      let shell = injectMeta(template, title, description);
      if (route === '') shell = injectHeroPreload(shell, heroPosterUrl);
      await writeFile(join(routeDir, 'index.html'), shell);
    }),
  );
}

async function buildTitleRoutes(template, catalog) {
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
  const rawTemplate = await readFile(indexPath, 'utf8');
  const basePath = detectBasePath(rawTemplate);
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const heroPosterUrl = catalog.items?.[0]?.poster ?? '';
  let template = injectResourceHints(rawTemplate);
  template = injectCatalogPreload(template, basePath);
  const indexShell = injectHeroPreload(template, heroPosterUrl);
  await writeFile(indexPath, indexShell);
  await ensureFileCopy(source404Path, dist404Path);
  await buildStaticShellRoutes(template, heroPosterUrl);
  await buildTitleRoutes(template, catalog);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
