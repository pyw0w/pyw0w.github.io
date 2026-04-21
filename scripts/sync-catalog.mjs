import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const MAX_FETCH_ATTEMPTS = 3;
const FETCH_BACKOFF_MS = 1000;

const animeTopRawItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().catch(''),
  description: z.string().catch(''),
  genre: z.string().catch(''),
  year: z.union([z.string(), z.number()]).transform(String).catch(''),
  urlImagePreview: z.string().catch(''),
  rating: z.union([z.string(), z.number()]).transform(Number).catch(0),
  votes: z.union([z.string(), z.number()]).transform(Number).catch(0),
  timer: z.union([z.string(), z.number()]).transform(Number).catch(0),
  type: z.string().catch(''),
  director: z.string().catch(''),
  screenImage: z.array(z.string()).catch([]),
}).passthrough();

const animeTopPageSchema = z.object({
  state: z.object({ count: z.union([z.string(), z.number()]).transform(Number).catch(0) }).passthrough().default({ count: 0 }),
  data: z.array(z.unknown()).catch([]),
}).passthrough();

const aniDubRawItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().catch(''),
  alt_name: z.string().catch(''),
  short_story: z.string().catch(''),
  full_story: z.string().catch(''),
  descr: z.string().catch(''),
  xfields: z.string().catch(''),
}).passthrough();

const aniLibriaCatalogItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.object({
    value: z.string().catch(''),
    description: z.string().catch(''),
  }).passthrough(),
  year: z.union([z.string(), z.number()]).transform(String).catch(''),
  name: z.object({
    main: z.string().catch(''),
    english: z.string().nullable().catch(''),
    alternative: z.string().nullable().catch(''),
  }).passthrough(),
  alias: z.string().catch(''),
  season: z.object({
    value: z.string().catch(''),
    description: z.string().catch(''),
  }).passthrough(),
  poster: z.object({
    src: z.string().catch(''),
    preview: z.string().catch(''),
    thumbnail: z.string().catch(''),
    optimized: z.object({
      src: z.string().catch(''),
      preview: z.string().catch(''),
      thumbnail: z.string().catch(''),
    }).partial().catch({}),
  }).passthrough(),
  fresh_at: z.string().catch(''),
  created_at: z.string().catch(''),
  updated_at: z.string().catch(''),
  is_ongoing: z.boolean().catch(false),
  description: z.string().catch(''),
  notification: z.string().nullable().catch(''),
  episodes_total: z.union([z.string(), z.number()]).nullable().transform((value) => (
    value === null || value === '' ? null : Number(value)
  )).catch(null),
  external_player: z.string().nullable().catch(''),
  is_in_production: z.boolean().catch(false),
  is_blocked_by_geo: z.boolean().catch(false),
  is_blocked_by_copyrights: z.boolean().catch(false),
  added_in_users_favorites: z.union([z.string(), z.number()]).transform(Number).catch(0),
  average_duration_of_episode: z.union([z.string(), z.number()]).transform(Number).catch(0),
  added_in_planned_collection: z.union([z.string(), z.number()]).transform(Number).catch(0),
  added_in_watched_collection: z.union([z.string(), z.number()]).transform(Number).catch(0),
  added_in_watching_collection: z.union([z.string(), z.number()]).transform(Number).catch(0),
  added_in_postponed_collection: z.union([z.string(), z.number()]).transform(Number).catch(0),
  added_in_abandoned_collection: z.union([z.string(), z.number()]).transform(Number).catch(0),
  genres: z.array(z.object({
    id: z.union([z.string(), z.number()]).transform(Number).catch(0),
    name: z.string().catch(''),
  }).passthrough()).catch([]),
}).passthrough();

const aniLibriaCatalogPageSchema = z.object({
  data: z.array(z.unknown()).catch([]),
  meta: z.object({
    pagination: z.object({
      total: z.union([z.string(), z.number()]).transform(Number).catch(0),
      count: z.union([z.string(), z.number()]).transform(Number).catch(0),
      per_page: z.union([z.string(), z.number()]).transform(Number).catch(0),
      current_page: z.union([z.string(), z.number()]).transform(Number).catch(1),
      total_pages: z.union([z.string(), z.number()]).transform(Number).catch(1),
      links: z.object({
        previous: z.string().optional(),
        next: z.string().optional(),
      }).partial().catch({}),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'public', 'data', 'catalog.json');
const titleDataDir = join(rootDir, 'public', 'data', 'titles');

const ANIMETOP_API_BASE = 'https://api.animetop.info/v1';
const ANIDUB_API_BASE = 'https://isekai.anidub.fun';
const ANIDUB_SEARCH_URL = `${ANIDUB_API_BASE}/mobile-api.php?name=search&story=`;
const ANILIBRIA_SITE_BASE = 'https://anilibria.top';
const ANILIBRIA_API_BASE = `${ANILIBRIA_SITE_BASE}/api/v1`;
const ANILIBRIA_CATALOG_PAGE_SIZE = 50;
const PAGE_SIZE = 40;
const STATUS_VALUES = ['Р С’Р Р…Р С•Р Р…РЎРѓ', 'Р С›Р Р…Р С–Р С•Р С‘Р Р…Р С–', 'Р вЂ”Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р ВµР Р…Р С•'];
const TRENDING_MIN_VOTES = 50;
const TRENDING_ONGOING_BOOST = 1.05;
const TRUSTED_EMBED_HOSTS_BY_SOURCE = {
  animetop: new Set(),
  anidub: new Set(['isekai.anidub.fun', 'player.ladonyvesna2005.info']),
  anilibria: new Set(),
};
const SEARCH_TEXT_MAX_LENGTH = 400;
const SEARCH_DESCRIPTION_MAX_LENGTH = 240;
const CYRILLIC_MAP = {
  '\u0430': 'a', '\u0431': 'b', '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0435': 'e', '\u0451': 'e', '\u0436': 'zh', '\u0437': 'z', '\u0438': 'i', '\u0439': 'y',
  '\u043a': 'k', '\u043b': 'l', '\u043c': 'm', '\u043d': 'n', '\u043e': 'o', '\u043f': 'p', '\u0440': 'r', '\u0441': 's', '\u0442': 't', '\u0443': 'u', '\u0444': 'f',
  '\u0445': 'h', '\u0446': 'ts', '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sch', '\u044a': '', '\u044b': 'y', '\u044c': '', '\u044d': 'e', '\u044e': 'yu', '\u044f': 'ya',
};
const GENRE_ALIASES = new Map([
  ['Р В±Р С•Р ВµР Р†РЎвЂ№Р Вµ Р С‘РЎРѓР С”РЎС“РЎРѓРЎРѓРЎвЂљР В°', 'Р В±Р С•Р ВµР Р†РЎвЂ№Р Вµ Р С‘РЎРѓР С”РЎС“РЎРѓРЎРѓРЎвЂљР Р†Р В°'],
  ['Р В±Р С•Р ВµР Р†РЎвЂ№Р Вµ Р С‘РЎРѓР С”РЎС“РЎРѓРЎРѓРЎвЂљР Р†', 'Р В±Р С•Р ВµР Р†РЎвЂ№Р Вµ Р С‘РЎРѓР С”РЎС“РЎРѓРЎРѓРЎвЂљР Р†Р В°'],
  ['Р С—Р С•Р Р†РЎРѓР ВµР Т‘Р Р…Р ВµР Р†Р С•РЎРѓРЎвЂљРЎРЉ', 'Р С—Р С•Р Р†РЎРѓР ВµР Т‘Р Р…Р ВµР Р†Р Р…Р С•РЎРѓРЎвЂљРЎРЉ'],
  ['Р С—РЎР‚Р С‘Р С”Р В»РЎР‹РЎвЂЎР ВµР Р…Р С‘Р Вµ', 'Р С—РЎР‚Р С‘Р С”Р В»РЎР‹РЎвЂЎР ВµР Р…Р С‘РЎРЏ'],
  ['Р С—РЎР‚Р С‘Р В»Р С”РЎР‹РЎвЂЎР ВµР Р…Р С‘РЎРЏ', 'Р С—РЎР‚Р С‘Р С”Р В»РЎР‹РЎвЂЎР ВµР Р…Р С‘РЎРЏ'],
  ['РЎР‚Р С•Р СР В°РЎвЂљР С‘Р С”Р В°', 'РЎР‚Р С•Р СР В°Р Р…РЎвЂљР С‘Р С”Р В°'],
  ['РЎР‚Р С•Р СР В°Р Р…Р С‘РЎвЂљР С”Р В°', 'РЎР‚Р С•Р СР В°Р Р…РЎвЂљР С‘Р С”Р В°'],
  ['РЎРѓР Р†Р ВµРЎР‚РЎвЂ¦Р ВµРЎРѓРЎвЂљР ВµРЎРѓРЎвЂљР Р†Р ВµР Р…Р Р…Р С•Р Вµ', 'РЎРѓР Р†Р ВµРЎР‚РЎвЂ¦РЎР‰Р ВµРЎРѓРЎвЂљР ВµРЎРѓРЎвЂљР Р†Р ВµР Р…Р Р…Р С•Р Вµ'],
  ['РЎРѓР ВµР Т‘Р В·Р Вµ', 'РЎРѓРЎвЂР Т‘Р В·РЎвЂ'],
  ['РЎРѓР ВµР Т‘Р В·Р Вµ Р В°Р С‘', 'РЎРѓРЎвЂР Т‘Р В·РЎвЂ-Р В°Р в„–'],
  ['РЎРѓР ВµР В·Р Т‘Р Вµ', 'РЎРѓРЎвЂР Т‘Р В·РЎвЂ'],
  ['РЎРѓР ВµР В·Р Т‘Р Вµ Р В°Р С‘', 'РЎРѓРЎвЂР Т‘Р В·РЎвЂ-Р В°Р в„–'],
  ['РЎРѓР ВµР Р…Р ВµР Р…', 'РЎРѓРЎвЂР Р…РЎРЊР Р…'],
  ['РЎРѓР ВµР Р…Р ВµР Р… Р В°Р С‘', 'РЎРѓРЎвЂР Р…РЎРЊР Р…-Р В°Р в„–'],
  ['РЎРѓР ВµР Р…РЎРЊР Р…', 'РЎРѓРЎвЂР Р…РЎРЊР Р…'],
  ['РЎРѓР ВµР Р…РЎРЊР Р… Р В°Р С‘', 'РЎРѓРЎвЂР Р…РЎРЊР Р…-Р В°Р в„–'],
  ['РЎРѓРЎС“Р С—Р ВµРЎР‚РЎРѓР С‘Р В»Р В°', 'РЎРѓРЎС“Р С—Р ВµРЎР‚ РЎРѓР С‘Р В»Р В°'],
  ['РЎвЂћР В°Р Р…РЎвЂљР В°РЎРѓРЎвЂљР С‘Р С”', 'РЎвЂћР В°Р Р…РЎвЂљР В°РЎРѓРЎвЂљР С‘Р С”Р В°'],
  ['РЎвЂћР ВµР Р…РЎвЂљР ВµР В·Р С‘', 'РЎвЂћРЎРЊР Р…РЎвЂљР ВµР В·Р С‘'],
  ['РЎвЂћРЎРЊР Р…РЎвЂљР В°Р В·Р С‘', 'РЎвЂћРЎРЊР Р…РЎвЂљР ВµР В·Р С‘'],
  ['РЎРЊРЎвЂљР С‘Р С‘', 'РЎРЊРЎвЂљРЎвЂљР С‘'],
  ['sci fi', 'Sci-Fi'],
  ['scifi', 'Sci-Fi'],
]);

function ensureHttps(url) {
  if (!url) return '';
  return String(url).replace(/^http:/i, 'https:');
}

function ensureAbsoluteUrl(baseUrl, url) {
  if (!url) return '';

  try {
    return new URL(String(url), baseUrl).toString();
  } catch {
    return '';
  }
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
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}РІР‚В¦`;
}

function decodeHtmlEntities(value = '') {
  const namedEntities = {
    amp: '&',
    quot: '"',
    '#039': "'",
    '#39': "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
    '#124': '|',
  };

  return String(value).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized in namedEntities) {
      return namedEntities[normalized];
    }
    if (normalized.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return match;
  });
}

function getTrustedEmbedUrlForSource(sourceId, url) {
  if (!url) return '';

  try {
    const parsed = new URL(String(url).replace(/^http:/i, 'https:'));
    if (parsed.protocol !== 'https:') return '';
    if (!TRUSTED_EMBED_HOSTS_BY_SOURCE[sourceId]?.has(parsed.host)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
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
  const isAnnouncement = String(fullTitle ?? '').includes('[Р С’Р Р…Р С•Р Р…РЎРѓ]');

  return {
    title: rawTitle.trim(),
    originalTitle,
    episodeLabel,
    badges,
    isAnnouncement,
  };
}

function parseEpisodeStats(episodeLabel) {
  const match = String(episodeLabel).match(/(\d+)(?:-(\d+))?\s+Р С‘Р В·\s+(\d+)(\+)?/i);
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
  if (isAnnouncement) return '\u0410\u043d\u043e\u043d\u0441';
  if (Number(timer) > 0) return '\u041e\u043d\u0433\u043e\u0438\u043d\u0433';
  if (hasOpenEndedTotal) return '\u041e\u043d\u0433\u043e\u0438\u043d\u0433';
  if (releasedEpisodes !== null && totalEpisodes !== null && releasedEpisodes < totalEpisodes) {
    return '\u041e\u043d\u0433\u043e\u0438\u043d\u0433';
  }
  return '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e';
}

function computeAverageScore(rating, votes) {
  const safeVotes = Number(votes) || 0;
  const safeRating = Number(rating) || 0;
  if (!safeVotes) return 0;
  return Number(((safeRating / safeVotes) * 2).toFixed(1));
}

function buildTrendingContext(rawItems) {
  const scoredItems = rawItems
    .map((rawItem) => computeAverageScore(rawItem.rating, rawItem.votes))
    .filter((score) => score > 0);

  const globalMean = scoredItems.length > 0
    ? scoredItems.reduce((total, score) => total + score, 0) / scoredItems.length
    : 0;

  return {
    globalMean,
    minVotes: TRENDING_MIN_VOTES,
  };
}

function computeTrendingScore({ averageScore, votes, status }, trendingContext) {
  const safeVotes = Number(votes) || 0;
  if (!safeVotes || status === 'Р С’Р Р…Р С•Р Р…РЎРѓ') return 0;

  const weightedRating = ((safeVotes / (safeVotes + trendingContext.minVotes)) * averageScore)
    + ((trendingContext.minVotes / (safeVotes + trendingContext.minVotes)) * trendingContext.globalMean);
  const voteBoost = Math.log10(safeVotes + 1);
  const statusBoost = status === 'Р С›Р Р…Р С–Р С•Р С‘Р Р…Р С–' ? TRENDING_ONGOING_BOOST : 1;

  return Number((weightedRating * voteBoost * statusBoost).toFixed(3));
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-zР В°-РЎРЏРЎвЂ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchText(parts, maxLength = SEARCH_TEXT_MAX_LENGTH) {
  const normalized = normalizeSearchText(parts.filter(Boolean).join(' '));
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  return lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped;
}

function normalizeGenreLabel(value) {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/[._]+$/g, '')
    .replace(/\s+/g, ' ');

  if (!trimmed) return '';

  const normalizedKey = normalizeSearchText(trimmed);
  if (!normalizedKey || normalizedKey === 'empty') return '';

  return GENRE_ALIASES.get(normalizedKey) ?? trimmed.toLocaleLowerCase('ru-RU');
}

function parseGenres(value) {
  const rawGenres = String(value ?? '')
    .replace(/[;|/]+/g, ',')
    .replace(/\.(?=\s*[\p{L}\p{N}])/gu, ',')
    .split(',');

  return uniqueStrings(rawGenres.map(normalizeGenreLabel));
}

function buildTitleId(sourceId, sourceTitleId) {
  return `${sourceId}-${sourceTitleId}`;
}

function parseOptionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeAnimeTopItem(rawItem, latestRank, trendingContext) {
  const parsed = parseTitleParts(rawItem.title);
  const episodeStats = parseEpisodeStats(parsed.episodeLabel);
  const plainDescription = stripHtml(rawItem.description);
  const genres = parseGenres(rawItem.genre);
  const rating = Number(rawItem.rating) || 0;
  const votes = Number(rawItem.votes) || 0;
  const averageScore = computeAverageScore(rating, votes);
  const timer = Number(rawItem.timer) || 0;
  const status = deriveStatus({
    isAnnouncement: parsed.isAnnouncement,
    timer,
    releasedEpisodes: episodeStats.releasedEpisodes,
    totalEpisodes: episodeStats.totalEpisodes,
    hasOpenEndedTotal: episodeStats.hasOpenEndedTotal,
  });
  const trendingScore = computeTrendingScore({ averageScore, votes, status }, trendingContext);
  const sourceTitleId = String(rawItem.id);

  return {
    id: buildTitleId('animetop', sourceTitleId),
    sourceId: 'animetop',
    sourceTitleId,
    slug: slugify(parsed.originalTitle || parsed.title, rawItem.id),
    title: parsed.title,
    originalTitle: parsed.originalTitle,
    episodeLabel: parsed.episodeLabel,
    year: String(rawItem.year ?? ''),
    genres,
    type: String(rawItem.type ?? '').trim(),
    director: String(rawItem.director ?? '').trim(),
    poster: ensureHttps(rawItem.urlImagePreview),
    shortDescription: truncateText(plainDescription, 240),
    rating,
    votes,
    averageScore,
    trendingScore,
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
      String(rawItem.director ?? ''),
      plainDescription.slice(0, SEARCH_DESCRIPTION_MAX_LENGTH),
    ]),
  };
}

function deriveAniLibriaStatus(rawItem) {
  if (rawItem.is_ongoing || rawItem.is_in_production) return '\u041e\u043d\u0433\u043e\u0438\u043d\u0433';
  return '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e';
}

function deriveAniLibriaEpisodeLabel(totalEpisodes) {
  if (totalEpisodes === null) return '';
  return `${totalEpisodes} Р РЋР РЉР В РЎвЂ”.`;
}

function normalizeAniLibriaItem(rawItem, latestRank) {
  const totalEpisodes = parseOptionalNumber(rawItem.episodes_total);
  const genres = uniqueStrings(rawItem.genres.map((genre) => normalizeGenreLabel(genre.name)));
  const title = String(rawItem.name.main ?? '').trim();
  const originalTitle = String(rawItem.name.english ?? rawItem.name.alternative ?? '').trim();
  const description = stripHtml(rawItem.description);
  const type = String(rawItem.type.description || rawItem.type.value || '').trim();

  return {
    id: buildTitleId('anilibria', rawItem.id),
    sourceId: 'anilibria',
    sourceTitleId: rawItem.id,
    slug: String(rawItem.alias ?? '').trim() || slugify(originalTitle || title, rawItem.id),
    title,
    originalTitle,
    episodeLabel: deriveAniLibriaEpisodeLabel(totalEpisodes),
    year: String(rawItem.year ?? '').trim(),
    genres,
    type,
    director: '',
    poster: ensureAbsoluteUrl(ANILIBRIA_SITE_BASE, rawItem.poster.optimized?.src || rawItem.poster.src || rawItem.poster.preview),
    shortDescription: truncateText(description, 240),
    rating: 0,
    votes: 0,
    averageScore: 0,
    trendingScore: 0,
    timer: 0,
    isAnnouncement: false,
    status: deriveAniLibriaStatus(rawItem),
    releasedEpisodes: null,
    totalEpisodes,
    latestRank,
    searchText: buildSearchText([
      title,
      originalTitle,
      rawItem.name.alternative,
      genres.join(' '),
      type,
      rawItem.year,
      rawItem.season.description,
      description.slice(0, SEARCH_DESCRIPTION_MAX_LENGTH),
    ]),
  };
}

function parseAniDubXfields(input = '') {
  const result = {};
  const parts = decodeHtmlEntities(input).split('||').filter(Boolean);

  for (const part of parts) {
    const separator = part.indexOf('|');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) continue;
    result[key] = value;
  }

  return result;
}

function parseAniDubNumber(value) {
  const numeric = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function inferAniDubType(title, xfields) {
  const normalizedTitle = String(title ?? '').toLowerCase();
  const originalTitle = String(xfields.orig_title ?? '').toLowerCase();
  const combined = `${normalizedTitle} ${originalTitle}`;

  if (/\bmovie\b|РЎвЂћР С‘Р В»РЎРЉР С/.test(combined)) return 'Р В¤Р С‘Р В»РЎРЉР С';
  if (/\bova\b/.test(combined)) return 'OVA';
  if (/\bona\b/.test(combined)) return 'ONA';
  if (/special|РЎРѓР С—РЎРЊРЎв‚¬Р В»|РЎРѓР С—Р ВµРЎвЂ Р Р†РЎвЂ№Р С—РЎС“РЎРѓР С”/.test(combined)) return 'Р РЋР С—Р ВµРЎв‚¬Р В»';
  return 'Р СћР вЂ™';
}

function deriveAniDubEpisodeLabel(releasedEpisodes, totalEpisodes) {
  if (releasedEpisodes !== null && totalEpisodes !== null) {
    return `${releasedEpisodes} Р С‘Р В· ${totalEpisodes}`;
  }
  if (releasedEpisodes !== null) {
    return `${releasedEpisodes} РЎРѓР ВµРЎР‚Р С‘РЎРЏ`;
  }
  if (totalEpisodes !== null) {
    return `0 Р С‘Р В· ${totalEpisodes}`;
  }
  return '';
}

function deriveAniDubStatus({ isAnnouncement, releasedEpisodes, totalEpisodes }) {
  if (isAnnouncement) return 'Р С’Р Р…Р С•Р Р…РЎРѓ';
  if (releasedEpisodes !== null && totalEpisodes !== null && releasedEpisodes < totalEpisodes) {
    return 'Р С›Р Р…Р С–Р С•Р С‘Р Р…Р С–';
  }
  return 'Р вЂ”Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р ВµР Р…Р С•';
}

function buildAniDubPosterUrl(xfields) {
  const posterPath = String(xfields.upposter2 ?? '').split('|')[0]?.trim();
  if (!posterPath) return '';
  return ensureHttps(`${ANIDUB_API_BASE}/uploads/posts/${posterPath.replace(/^\/+/, '')}`);
}

function pickAniDubDescription(rawItem) {
  const rich = String(rawItem.full_story ?? '').trim();
  if (rich) return rich;
  const short = String(rawItem.short_story ?? '').trim();
  if (short) return short;
  return String(rawItem.descr ?? '').trim();
}

function normalizeAniDubItem(rawItem, latestRank) {
  const xfields = parseAniDubXfields(rawItem.xfields);
  const releasedEpisodes = parseAniDubNumber(xfields.addepisode);
  const totalEpisodes = parseAniDubNumber(xfields.series);
  const isAnnouncement = String(xfields.anons ?? '') === '1';
  const status = deriveAniDubStatus({ isAnnouncement, releasedEpisodes, totalEpisodes });
  const plainDescription = stripHtml(pickAniDubDescription(rawItem));
  const genres = parseGenres(xfields.genre);
  const originalTitle = String(xfields.orig_title ?? '').trim();
  const title = String(rawItem.title ?? '').trim();
  const sourceTitleId = String(rawItem.id);
  const episodeLabel = deriveAniDubEpisodeLabel(releasedEpisodes, totalEpisodes);

  return {
    id: buildTitleId('anidub', sourceTitleId),
    sourceId: 'anidub',
    sourceTitleId,
    slug: slugify(originalTitle || rawItem.alt_name || title, sourceTitleId),
    title,
    originalTitle,
    episodeLabel,
    year: String(xfields.year ?? '').trim(),
    genres,
    type: inferAniDubType(title, xfields),
    director: String(xfields.director ?? '').trim(),
    poster: buildAniDubPosterUrl(xfields),
    shortDescription: truncateText(plainDescription, 240),
    rating: 0,
    votes: 0,
    averageScore: 0,
    trendingScore: 0,
    timer: 0,
    isAnnouncement,
    status,
    releasedEpisodes,
    totalEpisodes,
    latestRank,
    searchText: buildSearchText([
      title,
      originalTitle,
      rawItem.alt_name,
      genres.join(' '),
      xfields.year,
      xfields.director,
      plainDescription.slice(0, SEARCH_DESCRIPTION_MAX_LENGTH),
    ]),
  };
}

function buildAniDubTitleData(rawItem, normalizedItem, titleId = normalizedItem.id) {
  const xfields = parseAniDubXfields(rawItem.xfields);
  const playerUrl = getTrustedEmbedUrlForSource('anidub', decodeHtmlEntities(xfields.playerfull ?? ''));
  const hasEmbeddedPlayer = Boolean(playerUrl);
  const playbackMessage = hasEmbeddedPlayer
    ? undefined
    : xfields.player1
      ? 'Р вЂќР В»РЎРЏ РЎРЊРЎвЂљР С•Р С–Р С• РЎР‚Р ВµР В»Р С‘Р В·Р В° AniDub Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·РЎС“Р ВµРЎвЂљ Р Р†Р Р…Р ВµРЎв‚¬Р Р…Р С‘Р в„– Р В·Р В°РЎвЂ°Р С‘РЎвЂ°РЎвЂР Р…Р Р…РЎвЂ№Р в„– Р С—Р В»Р ВµР ВµРЎР‚, Р С”Р С•РЎвЂљР С•РЎР‚РЎвЂ№Р в„– Р Р…Р ВµР В»РЎРЉР В·РЎРЏ Р Р†РЎРѓРЎвЂљРЎР‚Р С•Р С‘РЎвЂљРЎРЉ Р Р† static-Р Р†Р ВµРЎР‚РЎРѓР С‘Р С‘ РЎРѓР В°Р в„–РЎвЂљР В°.'
      : 'Р вЂ™Р С‘Р Т‘Р ВµР С• Р Т‘Р В»РЎРЏ РЎРЊРЎвЂљР С•Р С–Р С• РЎР‚Р ВµР В»Р С‘Р В·Р В° Р С—Р С•Р С”Р В° Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р С•.';

  return {
    description: pickAniDubDescription(rawItem),
    playerUrl: hasEmbeddedPlayer ? playerUrl : undefined,
    playbackUnsupported: hasEmbeddedPlayer ? undefined : true,
    playbackMessage,
    playlist: hasEmbeddedPlayer
      ? [
        {
          id: `${titleId}-player`,
          name: normalizedItem.episodeLabel || 'Р СџР В»Р ВµР ВµРЎР‚ AniDub',
          hd: '',
          std: '',
          preview: normalizedItem.poster,
          playerUrl,
        },
      ]
      : [],
  };
}

function buildAniLibriaTitleData(rawItem) {
  const playerUrl = getTrustedEmbedUrlForSource('anilibria', rawItem.external_player ?? '');
  const hasExternalPlayer = Boolean(rawItem.external_player);
  const playbackUnsupported = Boolean(
    rawItem.is_blocked_by_geo
      || rawItem.is_blocked_by_copyrights
      || (hasExternalPlayer && !playerUrl),
  );

  let playbackMessage;
  if (rawItem.is_blocked_by_geo) {
    playbackMessage = 'Р В  Р В Р’ВµР В Р’В»Р В РЎвЂР В Р’В· AniLibria Р В РЎвЂўР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР В Р вЂ¦ Р В РЎвЂ”Р В РЎвЂў Р В РЎвЂ“Р В Р’ВµР В РЎвЂўР В Р’В»Р В РЎвЂўР В РЎвЂќР В Р’В°Р РЋРІР‚В Р В РЎвЂР В РЎвЂ.';
  } else if (rawItem.is_blocked_by_copyrights) {
    playbackMessage = 'Р В  Р В Р’ВµР В Р’В»Р В РЎвЂР В Р’В· AniLibria Р В Р вЂ¦Р В Р’ВµР В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋРЎвЂњР В РЎвЂ”Р В Р’ВµР В Р вЂ¦ Р В РЎвЂР В Р’В·-Р В Р’В·Р В Р’В° Р В РЎвЂўР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР В Р вЂ¦Р В РЎвЂР В РІвЂћвЂ“ Р В РЎвЂ”Р РЋР вЂљР В Р’В°Р В Р вЂ Р В РЎвЂўР В РЎвЂўР В Р’В±Р В Р’В»Р В Р’В°Р В РўвЂР В Р’В°Р РЋРІР‚С™Р В Р’ВµР В Р’В»Р РЋР РЏ.';
  } else if (hasExternalPlayer && !playerUrl) {
    playbackMessage = 'AniLibria Р В Р вЂ Р В Р’ВµР РЋР вЂљР В Р вЂ¦Р РЋРЎвЂњР В Р’В» Р В Р вЂ Р В Р вЂ¦Р В Р’ВµР РЋРІвЂљВ¬Р В Р вЂ¦Р В РЎвЂР В РІвЂћвЂ“ Р В РЎвЂ”Р В Р’В»Р В Р’ВµР В Р’ВµР РЋР вЂљ, Р В РЎвЂќР В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚в„–Р В РІвЂћвЂ“ Р В РЎвЂ”Р В РЎвЂўР В РЎвЂќР В Р’В° Р В Р вЂ¦Р В Р’Вµ Р В Р вЂ Р РЋРІР‚В¦Р В РЎвЂўР В РўвЂР В РЎвЂР РЋРІР‚С™ Р В Р вЂ  trusted allowlist static-Р В Р вЂ Р В Р’ВµР РЋР вЂљР РЋР С“Р В РЎвЂР В РЎвЂ.';
  }

  return {
    description: rawItem.description ?? '',
    playerUrl: playerUrl || undefined,
    playbackUnsupported: playbackUnsupported || undefined,
    playbackMessage,
    playlist: [],
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed for ${url}: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_FETCH_ATTEMPTS) break;
      const backoff = FETCH_BACKOFF_MS * (2 ** (attempt - 1));
      console.warn(`Fetch attempt ${attempt}/${MAX_FETCH_ATTEMPTS} failed for ${url}: ${error.message}. Retrying in ${backoff}ms.`);
      await delay(backoff);
    }
  }

  throw lastError;
}

async function fetchAnimeTopPage(page) {
  const payload = await fetchJson(`${ANIMETOP_API_BASE}/last?page=${page}&quantity=${PAGE_SIZE}`);
  const parsed = animeTopPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid AnimeTop response for page ${page}: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function fetchAniLibriaCatalogPage(page) {
  const payload = await fetchJson(`${ANILIBRIA_API_BASE}/anime/catalog/releases?limit=${ANILIBRIA_CATALOG_PAGE_SIZE}&page=${page}`);
  const parsed = aniLibriaCatalogPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid AniLibria response for page ${page}: ${parsed.error.message}`);
  }
  return parsed.data;
}

function parseAnimeTopItem(rawItem) {
  const parsed = animeTopRawItemSchema.safeParse(rawItem);
  if (!parsed.success) {
    console.warn('Skipping invalid AnimeTop item:', parsed.error.issues.map((issue) => issue.message).join('; '));
    return null;
  }
  return parsed.data;
}

async function fetchAnimeTopItems() {
  const firstPage = await fetchAnimeTopPage(1);
  const totalCount = Number(firstPage?.state?.count) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const allRawItems = [...firstPage.data];

  for (let page = 2; page <= totalPages; page += 1) {
    console.log(`Fetching AnimeTop page ${page}/${totalPages}`);
    const nextPage = await fetchAnimeTopPage(page);
    allRawItems.push(...nextPage.data);
  }

  const uniqueItems = [];
  const seenIds = new Set();
  let skipped = 0;

  for (const entry of allRawItems) {
    const rawItem = parseAnimeTopItem(entry);
    if (!rawItem) {
      skipped += 1;
      continue;
    }
    const id = rawItem.id;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueItems.push(rawItem);
  }

  if (skipped) {
    console.warn(`Skipped ${skipped} invalid AnimeTop items.`);
  }

  const trendingContext = buildTrendingContext(uniqueItems);
  return uniqueItems.map((rawItem, index) => normalizeAnimeTopItem(rawItem, index, trendingContext));
}

async function fetchAniDubItems() {
  const payload = await fetchJson(ANIDUB_SEARCH_URL);
  const rawItems = Array.isArray(payload) ? payload : [];
  const uniqueItems = [];
  const seenIds = new Set();
  let skipped = 0;

  for (const entry of rawItems) {
    const parsed = aniDubRawItemSchema.safeParse(entry);
    if (!parsed.success) {
      skipped += 1;
      continue;
    }
    const id = parsed.data.id.trim();
    const title = parsed.data.title.trim();
    if (!id || !title || seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueItems.push(parsed.data);
  }

  if (skipped) {
    console.warn(`Skipped ${skipped} invalid AniDub items.`);
  }

  return uniqueItems.map((rawItem, index) => ({
    rawItem,
    normalized: normalizeAniDubItem(rawItem, index),
  }));
}

async function fetchAniLibriaItems() {
  const firstPage = await fetchAniLibriaCatalogPage(1);
  const totalPages = Math.max(1, Number(firstPage.meta?.pagination?.total_pages) || 1);
  const allRawItems = [...firstPage.data];

  for (let page = 2; page <= totalPages; page += 1) {
    console.log(`Fetching AniLibria catalog page ${page}/${totalPages}`);
    const nextPage = await fetchAniLibriaCatalogPage(page);
    allRawItems.push(...nextPage.data);
  }

  const uniqueItems = [];
  const seenIds = new Set();
  let skipped = 0;

  for (const entry of allRawItems) {
    const parsed = aniLibriaCatalogItemSchema.safeParse(entry);
    if (!parsed.success) {
      skipped += 1;
      continue;
    }

    const id = parsed.data.id.trim();
    const title = parsed.data.name.main.trim();
    if (!id || !title || seenIds.has(id)) continue;

    seenIds.add(id);
    uniqueItems.push(parsed.data);
  }

  if (skipped) {
    console.warn(`Skipped ${skipped} invalid AniLibria items.`);
  }

  return uniqueItems.map((rawItem, index) => ({
    rawItem,
    normalized: normalizeAniLibriaItem(rawItem, index),
  }));
}

function buildCanonicalMergeKey(item) {
  const originalTitle = normalizeSearchText(item.originalTitle);
  const year = normalizeSearchText(item.year);
  const type = normalizeSearchText(item.type);

  if (!originalTitle || !year || !type) return '';
  return `${originalTitle}|${year}|${type}`;
}

function addToMapArray(map, key, value) {
  if (!key) return;
  const current = map.get(key);
  if (current) {
    current.push(value);
    return;
  }
  map.set(key, [value]);
}

function getProviderSortRank(item) {
  return (item.latestRank * 4) + getSourcePriority(item);
}

function getSourcePriority(item) {
  if (item.sourceId === 'animetop') return 0;
  if (item.sourceId === 'anilibria') return 1;
  if (item.sourceId === 'anidub') return 2;
  return 3;
}

function choosePrimaryItem(items) {
  return [...items].sort((left, right) => (
    getSourcePriority(left) - getSourcePriority(right)
      || getProviderSortRank(left) - getProviderSortRank(right)
  ))[0];
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildTitleSource(item) {
  return {
    sourceId: item.sourceId,
    sourceTitleId: item.sourceTitleId,
    legacyTitleId: item.id,
    legacySlug: item.slug,
    title: item.title,
    originalTitle: item.originalTitle,
    episodeLabel: item.episodeLabel,
    status: item.status,
    isAnnouncement: item.isAnnouncement,
    releasedEpisodes: item.releasedEpisodes,
    totalEpisodes: item.totalEpisodes,
    latestRank: item.latestRank,
  };
}

function buildCanonicalItem(items) {
  const orderedItems = [...items].sort((left, right) => getProviderSortRank(left) - getProviderSortRank(right));
  const primary = choosePrimaryItem(orderedItems);

  return {
    id: primary.id,
    slug: primary.slug,
    title: primary.title,
    originalTitle: primary.originalTitle,
    episodeLabel: primary.episodeLabel,
    year: primary.year,
    genres: uniqueStrings(orderedItems.flatMap((item) => item.genres)),
    type: primary.type,
    director: primary.director,
    poster: primary.poster,
    shortDescription: primary.shortDescription,
    rating: primary.rating,
    votes: primary.votes,
    averageScore: primary.averageScore,
    trendingScore: Math.max(...orderedItems.map((item) => item.trendingScore)),
    timer: primary.timer,
    isAnnouncement: primary.isAnnouncement,
    status: primary.status,
    releasedEpisodes: primary.releasedEpisodes,
    totalEpisodes: primary.totalEpisodes,
    latestRank: Math.min(...orderedItems.map(getProviderSortRank)),
    searchText: buildSearchText([orderedItems.map((item) => item.searchText).join(' ')]),
    primarySourceId: primary.sourceId,
    sources: orderedItems.map(buildTitleSource),
  };
}

function buildCanonicalGroups(items) {
  const itemsByKey = new Map();
  const groups = [];

  for (const item of items) {
    const key = buildCanonicalMergeKey(item);
    if (!key) {
      groups.push([item]);
      continue;
    }
    addToMapArray(itemsByKey, key, item);
  }

  for (const groupedItems of itemsByKey.values()) {
    const groupedBySource = new Map();
    groupedItems.forEach((item) => addToMapArray(groupedBySource, item.sourceId, item));

    const hasDuplicateSource = [...groupedBySource.values()].some((entries) => entries.length > 1);
    if (hasDuplicateSource) {
      groupedItems.forEach((item) => groups.push([item]));
      continue;
    }

    groups.push(groupedItems);
  }

  return groups
    .map((items) => ({
      items,
      latestRank: Math.min(...items.map(getProviderSortRank)),
    }))
    .sort((left, right) => left.latestRank - right.latestRank)
    .map((entry) => entry.items);
}

async function writeAniDubTitleData(entries) {
  await rm(titleDataDir, { recursive: true, force: true });
  await mkdir(titleDataDir, { recursive: true });

  for (const [titleId, payload] of entries) {
    await writeFile(join(titleDataDir, `${titleId}.json`), JSON.stringify(payload));
  }
}

async function main() {
  console.log('Syncing merged catalog snapshot...');
  const [animeTopItems, aniDubEntries, aniLibriaItems] = await Promise.all([
    fetchAnimeTopItems(),
    fetchAniDubItems(),
    fetchAniLibriaItems(),
  ]);

  const aniDubItems = aniDubEntries.map((entry) => entry.normalized);
  const aniDubEntriesByLegacyId = new Map(aniDubEntries.map((entry) => [entry.normalized.id, entry]));
  const aniLibriaNormalizedItems = aniLibriaItems.map((entry) => entry.normalized);
  const aniLibriaEntriesByLegacyId = new Map(aniLibriaItems.map((entry) => [entry.normalized.id, entry]));
  const groups = buildCanonicalGroups([
    ...animeTopItems,
    ...aniDubItems,
    ...aniLibriaNormalizedItems,
  ]);
  const groupedItems = groups.map((groupItems) => ({
    item: buildCanonicalItem(groupItems),
    groupItems,
  }));
  const items = groupedItems.map((entry) => entry.item);
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

  const titleDataEntries = groupedItems.flatMap(({ item }) => {
    const sources = {};
    const aniDubSource = item.sources.find((source) => source.sourceId === 'anidub');
    if (aniDubSource) {
      const aniDubEntry = aniDubEntriesByLegacyId.get(aniDubSource.legacyTitleId);
      if (aniDubEntry) {
        sources.anidub = buildAniDubTitleData(aniDubEntry.rawItem, aniDubEntry.normalized, item.id);
      }
    }

    const aniLibriaSource = item.sources.find((source) => source.sourceId === 'anilibria');
    if (aniLibriaSource) {
      const aniLibriaEntry = aniLibriaEntriesByLegacyId.get(aniLibriaSource.legacyTitleId);
      if (aniLibriaEntry) {
        sources.anilibria = buildAniLibriaTitleData(aniLibriaEntry.rawItem);
      }
    }

    if (Object.keys(sources).length === 0) return [];

    return [[item.id, { sources }]];
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload));
  await writeAniDubTitleData(titleDataEntries);

  console.log(`Saved ${items.length} titles to ${outputPath}`);
  console.log(`Saved ${titleDataEntries.length} static title payloads to ${titleDataDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
