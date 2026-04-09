import { z } from 'zod';
import type {
  BrowseParams,
  BrowseResult,
  CatalogSnapshot,
  CatalogTitle,
  PlaylistEpisode,
  TitleDetail,
  TitleStatus,
} from '../../entities/catalog';

const API_BASE = 'https://api.animetop.info/v1';
const PAGE_SIZE = 24;

const catalogTitleSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  originalTitle: z.string(),
  fullTitle: z.string(),
  episodeLabel: z.string(),
  badges: z.array(z.string()),
  year: z.string(),
  genres: z.array(z.string()),
  type: z.string(),
  director: z.string(),
  poster: z.string(),
  screens: z.array(z.string()),
  shortDescription: z.string(),
  rating: z.number(),
  votes: z.number(),
  averageScore: z.number(),
  trendingScore: z.number(),
  timer: z.number(),
  isAnnouncement: z.boolean(),
  status: z.custom<TitleStatus>(),
  releasedEpisodes: z.number().nullable(),
  totalEpisodes: z.number().nullable(),
  latestRank: z.number(),
  searchText: z.string(),
});

const catalogSnapshotSchema = z.object({
  generatedAt: z.string(),
  totalCount: z.number(),
  filters: z.object({
    genres: z.array(z.string()),
    years: z.array(z.string()),
    types: z.array(z.string()),
    statuses: z.array(z.custom<TitleStatus>()),
  }),
  items: z.array(catalogTitleSchema),
});

const detailResponseSchema = z.object({
  state: z.object({
    status: z.string(),
  }),
  data: z.array(
    z.object({
      id: z.number(),
      description: z.string().catch(''),
      title: z.string(),
      genre: z.string().catch(''),
      year: z.union([z.string(), z.number()]).transform(String),
      urlImagePreview: z.string(),
      rating: z.union([z.string(), z.number()]).transform(Number),
      votes: z.union([z.string(), z.number()]).transform(Number),
      timer: z.union([z.string(), z.number()]).transform(Number).catch(0),
      type: z.string().catch(''),
      director: z.string().catch(''),
    }),
  ),
});

const playlistSchema = z.array(
  z.object({
    name: z.string(),
    hd: z.string(),
    std: z.string(),
    preview: z.string(),
  }),
);

let snapshotPromise: Promise<CatalogSnapshot> | null = null;

function ensureHttps(url: string): string {
  return url.replace(/^http:/i, 'https:');
}

function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  return searchParams.toString();
}

export function getBasePath(): string {
  if (typeof window === 'undefined') return import.meta.env.BASE_URL.replace(/\/$/, '');
  const configuredBase = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (configuredBase && configuredBase !== '/') return configuredBase;
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'pyw0w.github.io') return '/pyw0w.github.io';
  return '';
}

export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  if (!snapshotPromise) {
    snapshotPromise = fetch(`${getBasePath()}/data/catalog.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load catalog snapshot: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => catalogSnapshotSchema.parse(payload));
  }

  return snapshotPromise;
}

function matchesSearch(title: CatalogTitle, search: string): boolean {
  if (!search) return true;
  return title.searchText.includes(search.toLowerCase().trim());
}

function matchesFilters(title: CatalogTitle, params: BrowseParams): boolean {
  if (params.genre && !title.genres.includes(params.genre)) return false;
  if (params.status && title.status !== params.status) return false;
  if (params.year && title.year !== params.year) return false;
  if (params.type && title.type !== params.type) return false;
  return true;
}

function sortTitles(items: CatalogTitle[], sort: BrowseParams['sort']): CatalogTitle[] {
  const copy = [...items];
  if (sort === 'trending') {
    return copy.sort((left, right) => right.trendingScore - left.trendingScore);
  }
  if (sort === 'rating') {
    return copy.sort((left, right) => right.averageScore - left.averageScore || right.votes - left.votes);
  }
  return copy.sort((left, right) => left.latestRank - right.latestRank);
}

export async function getBrowseResults(params: BrowseParams): Promise<BrowseResult> {
  const snapshot = await getCatalogSnapshot();
  const filtered = sortTitles(
    snapshot.items.filter((title) => matchesSearch(title, params.search) && matchesFilters(title, params)),
    params.sort,
  );
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(params.page, 1), pageCount);
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount,
  };
}

export async function getLatestTitles(limit = 12): Promise<CatalogTitle[]> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.items.slice(0, limit);
}

export async function getTrendingTitles(limit = 12): Promise<CatalogTitle[]> {
  const snapshot = await getCatalogSnapshot();
  return [...snapshot.items]
    .sort((left, right) => right.trendingScore - left.trendingScore)
    .slice(0, limit);
}

export async function getTitleSummary(id: number): Promise<CatalogTitle | null> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.items.find((item) => item.id === id) ?? null;
}

export async function getTitleDetail(id: number): Promise<TitleDetail> {
  const [summary, response] = await Promise.all([
    getTitleSummary(id),
    fetch(`${API_BASE}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: buildQuery({ id: String(id) }),
    }).then(async (result) => {
      if (!result.ok) {
        throw new Error(`Failed to load title info: ${result.status}`);
      }
      return detailResponseSchema.parse(await result.json());
    }),
  ]);

  if (!summary) {
    throw new Error('Title summary not found');
  }

  const detail = response.data[0];
  return {
    ...summary,
    description: detail.description,
    poster: ensureHttps(detail.urlImagePreview),
    rating: detail.rating,
    votes: detail.votes,
    averageScore: detail.votes ? Number(((detail.rating / detail.votes) * 2).toFixed(1)) : 0,
    timer: detail.timer,
    type: detail.type,
    director: detail.director,
  };
}

export async function getPlaylist(id: number): Promise<PlaylistEpisode[]> {
  const response = await fetch(`${API_BASE}/playlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildQuery({ id: String(id) }),
  });

  if (!response.ok) {
    throw new Error(`Failed to load playlist: ${response.status}`);
  }

  const payload = playlistSchema.parse(await response.json());

  return payload.map((episode) => ({
    id: episode.name,
    name: episode.name,
    hd: ensureHttps(episode.hd),
    std: ensureHttps(episode.std),
    preview: ensureHttps(episode.preview),
  }));
}

export async function getRelatedTitles(title: CatalogTitle, limit = 8): Promise<CatalogTitle[]> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.items
    .filter((item) => item.id !== title.id)
    .map((item) => {
      const genreOverlap = item.genres.filter((genre) => title.genres.includes(genre)).length;
      const sameYear = item.year === title.year ? 1 : 0;
      const sameType = item.type === title.type ? 1 : 0;
      return {
        item,
        score: genreOverlap * 10 + sameYear * 2 + sameType,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || right.item.trendingScore - left.item.trendingScore)
    .slice(0, limit)
    .map((entry) => entry.item);
}
