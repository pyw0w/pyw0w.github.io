import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'public', 'data', 'catalog.json');
const titleDataDir = join(rootDir, 'public', 'data', 'titles');

const ANIMETOP_API_BASE = 'https://api.animetop.info/v1';
const ANIDUB_API_BASE = 'https://isekai.anidub.fun';
const ANIDUB_SEARCH_URL = `${ANIDUB_API_BASE}/mobile-api.php?name=search&story=`;
const PAGE_SIZE = 40;
const STATUS_VALUES = ['Анонс', 'Онгоинг', 'Завершено'];
const TRENDING_MIN_VOTES = 50;
const TRENDING_ONGOING_BOOST = 1.05;
const TRUSTED_ANIDUB_PLAYER_HOSTS = new Set(['isekai.anidub.fun', 'player.ladonyvesna2005.info']);
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

function getTrustedAniDubPlayerUrl(url) {
  if (!url) return '';

  try {
    const parsed = new URL(String(url).replace(/^http:/i, 'https:'));
    if (parsed.protocol !== 'https:') return '';
    if (!TRUSTED_ANIDUB_PLAYER_HOSTS.has(parsed.host)) return '';
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
  if (!safeVotes || status === 'Анонс') return 0;

  const weightedRating = ((safeVotes / (safeVotes + trendingContext.minVotes)) * averageScore)
    + ((trendingContext.minVotes / (safeVotes + trendingContext.minVotes)) * trendingContext.globalMean);
  const voteBoost = Math.log10(safeVotes + 1);
  const statusBoost = status === 'Онгоинг' ? TRENDING_ONGOING_BOOST : 1;

  return Number((weightedRating * voteBoost * statusBoost).toFixed(3));
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

function buildTitleId(sourceId, sourceTitleId) {
  return `${sourceId}-${sourceTitleId}`;
}

function normalizeAnimeTopItem(rawItem, latestRank, trendingContext) {
  const parsed = parseTitleParts(rawItem.title);
  const episodeStats = parseEpisodeStats(parsed.episodeLabel);
  const plainDescription = stripHtml(rawItem.description);
  const genres = String(rawItem.genre ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
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
      plainDescription,
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

  if (/\bmovie\b|фильм/.test(combined)) return 'Фильм';
  if (/\bova\b/.test(combined)) return 'OVA';
  if (/\bona\b/.test(combined)) return 'ONA';
  if (/special|спэшл|спецвыпуск/.test(combined)) return 'Спешл';
  return 'ТВ';
}

function deriveAniDubEpisodeLabel(releasedEpisodes, totalEpisodes) {
  if (releasedEpisodes !== null && totalEpisodes !== null) {
    return `${releasedEpisodes} из ${totalEpisodes}`;
  }
  if (releasedEpisodes !== null) {
    return `${releasedEpisodes} серия`;
  }
  if (totalEpisodes !== null) {
    return `0 из ${totalEpisodes}`;
  }
  return '';
}

function deriveAniDubStatus({ isAnnouncement, releasedEpisodes, totalEpisodes }) {
  if (isAnnouncement) return 'Анонс';
  if (releasedEpisodes !== null && totalEpisodes !== null && releasedEpisodes < totalEpisodes) {
    return 'Онгоинг';
  }
  return 'Завершено';
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
  const genres = String(xfields.genre ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const originalTitle = String(xfields.orig_title ?? '').trim();
  const title = String(rawItem.title ?? '').trim();
  const sourceTitleId = String(rawItem.id);
  const season = parseAniDubNumber(xfields.addseason);
  const episodeLabel = deriveAniDubEpisodeLabel(releasedEpisodes, totalEpisodes);
  const badges = season && season > 1 ? [`Сезон ${season}`] : [];

  return {
    id: buildTitleId('anidub', sourceTitleId),
    sourceId: 'anidub',
    sourceTitleId,
    slug: slugify(originalTitle || rawItem.alt_name || title, sourceTitleId),
    title,
    originalTitle,
    fullTitle: title,
    episodeLabel,
    badges,
    year: String(xfields.year ?? '').trim(),
    genres,
    type: inferAniDubType(title, xfields),
    director: String(xfields.director ?? '').trim(),
    poster: buildAniDubPosterUrl(xfields),
    screens: [],
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
      plainDescription,
    ]),
  };
}

function buildAniDubTitleData(rawItem, normalizedItem, titleId = normalizedItem.id) {
  const xfields = parseAniDubXfields(rawItem.xfields);
  const playerUrl = getTrustedAniDubPlayerUrl(decodeHtmlEntities(xfields.playerfull ?? ''));
  const hasEmbeddedPlayer = Boolean(playerUrl);
  const playbackMessage = hasEmbeddedPlayer
    ? undefined
    : xfields.player1
      ? 'Для этого релиза AniDub использует внешний защищённый плеер, который нельзя встроить в static-версии сайта.'
      : 'Видео для этого релиза пока недоступно.';

  return {
    description: pickAniDubDescription(rawItem),
    playerUrl: hasEmbeddedPlayer ? playerUrl : undefined,
    playbackUnsupported: hasEmbeddedPlayer ? undefined : true,
    playbackMessage,
    playlist: hasEmbeddedPlayer
      ? [
        {
          id: `${titleId}-player`,
          name: normalizedItem.episodeLabel || 'Плеер AniDub',
          hd: '',
          std: '',
          preview: normalizedItem.poster,
          playerUrl,
        },
      ]
      : [],
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

async function fetchAnimeTopPage(page) {
  return fetchJson(`${ANIMETOP_API_BASE}/last?page=${page}&quantity=${PAGE_SIZE}`);
}

async function fetchAnimeTopItems() {
  const firstPage = await fetchAnimeTopPage(1);
  const totalCount = Number(firstPage?.state?.count) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const allRawItems = [...(Array.isArray(firstPage.data) ? firstPage.data : [])];

  for (let page = 2; page <= totalPages; page += 1) {
    console.log(`Fetching AnimeTop page ${page}/${totalPages}`);
    const nextPage = await fetchAnimeTopPage(page);
    if (Array.isArray(nextPage.data)) {
      allRawItems.push(...nextPage.data);
    }
  }

  const uniqueItems = [];
  const seenIds = new Set();

  for (const rawItem of allRawItems) {
    const id = String(rawItem.id);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueItems.push(rawItem);
  }

  const trendingContext = buildTrendingContext(uniqueItems);
  return uniqueItems.map((rawItem, index) => normalizeAnimeTopItem(rawItem, index, trendingContext));
}

async function fetchAniDubItems() {
  const payload = await fetchJson(ANIDUB_SEARCH_URL);
  const rawItems = Array.isArray(payload) ? payload : [];
  const uniqueItems = [];
  const seenIds = new Set();

  for (const rawItem of rawItems) {
    const id = String(rawItem.id ?? '').trim();
    const title = String(rawItem.title ?? '').trim();
    if (!id || !title || seenIds.has(id)) continue;
    seenIds.add(id);
    uniqueItems.push(rawItem);
  }

  return uniqueItems.map((rawItem, index) => ({
    rawItem,
    normalized: normalizeAniDubItem(rawItem, index),
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
  return (item.latestRank * 2) + (item.sourceId === 'animetop' ? 0 : 1);
}

function choosePrimaryItem(items) {
  return items.find((item) => item.sourceId === 'animetop') ?? items[0];
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
    fullTitle: item.fullTitle,
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
    fullTitle: primary.fullTitle,
    episodeLabel: primary.episodeLabel,
    badges: uniqueStrings(orderedItems.flatMap((item) => item.badges)),
    year: primary.year,
    genres: uniqueStrings(orderedItems.flatMap((item) => item.genres)),
    type: primary.type,
    director: primary.director,
    poster: primary.poster,
    screens: uniqueStrings(orderedItems.flatMap((item) => item.screens)),
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
    searchText: normalizeSearchText(orderedItems.map((item) => item.searchText).join(' ')),
    primarySourceId: primary.sourceId,
    sources: orderedItems.map(buildTitleSource),
  };
}

function buildCanonicalGroups(animeTopItems, aniDubItems) {
  const animeTopByKey = new Map();
  const aniDubByKey = new Map();

  animeTopItems.forEach((item) => addToMapArray(animeTopByKey, buildCanonicalMergeKey(item), item));
  aniDubItems.forEach((item) => addToMapArray(aniDubByKey, buildCanonicalMergeKey(item), item));

  const usedIds = new Set();
  const groups = [];

  for (const [key, animeTopMatches] of animeTopByKey) {
    const aniDubMatches = aniDubByKey.get(key);
    if (animeTopMatches.length !== 1 || !aniDubMatches || aniDubMatches.length !== 1) continue;

    const [animeTopItem] = animeTopMatches;
    const [aniDubItem] = aniDubMatches;
    usedIds.add(animeTopItem.id);
    usedIds.add(aniDubItem.id);
    groups.push([animeTopItem, aniDubItem]);
  }

  for (const item of animeTopItems) {
    if (!usedIds.has(item.id)) groups.push([item]);
  }

  for (const item of aniDubItems) {
    if (!usedIds.has(item.id)) groups.push([item]);
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
  const [animeTopItems, aniDubEntries] = await Promise.all([
    fetchAnimeTopItems(),
    fetchAniDubItems(),
  ]);

  const aniDubItems = aniDubEntries.map((entry) => entry.normalized);
  const aniDubEntriesByLegacyId = new Map(aniDubEntries.map((entry) => [entry.normalized.id, entry]));
  const groups = buildCanonicalGroups(animeTopItems, aniDubItems);
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
    const aniDubSource = item.sources.find((source) => source.sourceId === 'anidub');
    if (!aniDubSource) return [];

    const aniDubEntry = aniDubEntriesByLegacyId.get(aniDubSource.legacyTitleId);
    if (!aniDubEntry) return [];

    return [[item.id, {
      sources: {
        anidub: buildAniDubTitleData(aniDubEntry.rawItem, aniDubEntry.normalized, item.id),
      },
    }]];
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload));
  await writeAniDubTitleData(titleDataEntries);

  console.log(`Saved ${items.length} titles to ${outputPath}`);
  console.log(`Saved ${titleDataEntries.length} AniDub title payloads to ${titleDataDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
