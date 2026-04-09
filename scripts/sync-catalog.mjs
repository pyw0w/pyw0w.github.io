import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'public', 'data', 'catalog.json');

const API_BASE = 'https://api.animetop.info/v1';
const PAGE_SIZE = 40;
const STATUS_VALUES = ['Анонс', 'Онгоинг', 'Завершено'];
const CYRILLIC_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function ensureHttps(url) {
  if (!url) return '';
  return String(url).replace(/^http:/i, 'https:');
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function slugify(value, fallbackId) {
  const transliterated = String(value ?? '')
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return transliterated || `title-${fallbackId}`;
}

function parseTitleParts(fullTitle) {
  const [rawTitle, rawRest = ''] = String(fullTitle ?? '').split(' / ');
  const bracketMatches = [...String(fullTitle ?? '').matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim());
  const originalTitle = rawRest ? rawRest.split(' [')[0].trim() : '';
  const episodeLabel = bracketMatches[0] ?? '';
  const badges = bracketMatches.slice(1);
  const isAnnouncement = String(fullTitle ?? '').includes('[Анонс]');

  return {
    title: rawTitle.trim(),
    originalTitle,
    episodeLabel,
    badges,
    isAnnouncement,
  };
}

function parseEpisodeStats(episodeLabel) {
  const match = String(episodeLabel).match(/(\d+)(?:-(\d+))?\s+из\s+(\d+)(\+)?/i);
  if (!match) {
    return {
      releasedEpisodes: null,
      totalEpisodes: null,
      hasOpenEndedTotal: false,
    };
  }

  const first = Number.parseInt(match[1], 10);
  const second = match[2] ? Number.parseInt(match[2], 10) : null;
  const total = Number.parseInt(match[3], 10);

  return {
    releasedEpisodes: second ?? first,
    totalEpisodes: total,
    hasOpenEndedTotal: Boolean(match[4]),
  };
}

function deriveStatus({ isAnnouncement, timer, releasedEpisodes, totalEpisodes, hasOpenEndedTotal }) {
  if (isAnnouncement) return 'Анонс';
  if (Number(timer) > 0) return 'Онгоинг';
  if (hasOpenEndedTotal) return 'Онгоинг';
  if (releasedEpisodes !== null && totalEpisodes !== null && releasedEpisodes < totalEpisodes) {
    return 'Онгоинг';
  }
  return 'Завершено';
}

function computeTrendingScore(rating, votes) {
  const safeVotes = Number(votes) || 0;
  const safeRating = Number(rating) || 0;
  if (!safeVotes) return 0;

  const average = (safeRating / safeVotes) * 2;
  return Number((average * Math.log10(safeVotes + 10)).toFixed(3));
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-zа-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchText(parts) {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

function normalizeItem(rawItem, latestRank) {
  const parsed = parseTitleParts(rawItem.title);
  const episodeStats = parseEpisodeStats(parsed.episodeLabel);
  const plainDescription = stripHtml(rawItem.description);
  const genres = String(rawItem.genre ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const rating = Number(rawItem.rating) || 0;
  const votes = Number(rawItem.votes) || 0;
  const averageScore = votes ? Number(((rating / votes) * 2).toFixed(1)) : 0;
  const timer = Number(rawItem.timer) || 0;
  const status = deriveStatus({
    isAnnouncement: parsed.isAnnouncement,
    timer,
    releasedEpisodes: episodeStats.releasedEpisodes,
    totalEpisodes: episodeStats.totalEpisodes,
    hasOpenEndedTotal: episodeStats.hasOpenEndedTotal,
  });

  return {
    id: Number(rawItem.id),
    slug: slugify(parsed.originalTitle || parsed.title, rawItem.id),
    title: parsed.title,
    originalTitle: parsed.originalTitle,
    fullTitle: String(rawItem.title ?? ''),
    episodeLabel: parsed.episodeLabel,
    badges: parsed.badges,
    year: String(rawItem.year ?? ''),
    genres,
    type: String(rawItem.type ?? '').trim(),
    director: String(rawItem.director ?? '').trim(),
    poster: ensureHttps(rawItem.urlImagePreview),
    screens: Array.isArray(rawItem.screenImage) ? rawItem.screenImage.map(ensureHttps).filter(Boolean) : [],
    shortDescription: truncateText(plainDescription, 240),
    rating,
    votes,
    averageScore,
    trendingScore: computeTrendingScore(rating, votes),
    timer,
    isAnnouncement: parsed.isAnnouncement,
    status,
    releasedEpisodes: episodeStats.releasedEpisodes,
    totalEpisodes: episodeStats.totalEpisodes,
    latestRank,
    searchText: buildSearchText([
      parsed.title,
      parsed.originalTitle,
      genres.join(' '),
      rawItem.type,
      rawItem.year,
      plainDescription,
    ]),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchPage(page) {
  return fetchJson(`${API_BASE}/last?page=${page}&quantity=${PAGE_SIZE}`);
}

async function main() {
  console.log('Syncing catalog snapshot from API...');
  const firstPage = await fetchPage(1);
  const totalCount = Number(firstPage?.state?.count) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const allRawItems = [...(Array.isArray(firstPage.data) ? firstPage.data : [])];

  for (let page = 2; page <= totalPages; page += 1) {
    console.log(`Fetching page ${page}/${totalPages}`);
    const nextPage = await fetchPage(page);
    if (Array.isArray(nextPage.data)) {
      allRawItems.push(...nextPage.data);
    }
  }

  const uniqueItems = [];
  const seenIds = new Set();

  for (const rawItem of allRawItems) {
    const id = Number(rawItem.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueItems.push(rawItem);
  }

  const items = uniqueItems.map((rawItem, index) => normalizeItem(rawItem, index));
  const filters = {
    genres: [...new Set(items.flatMap((item) => item.genres))].sort((left, right) => left.localeCompare(right, 'ru')),
    years: [...new Set(items.map((item) => item.year).filter(Boolean))].sort((left, right) => Number(right) - Number(left)),
    types: [...new Set(items.map((item) => item.type).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'ru')),
    statuses: STATUS_VALUES,
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    totalCount: items.length,
    filters,
    items,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload));

  console.log(`Saved ${items.length} titles to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
