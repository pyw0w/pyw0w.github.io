import { z } from 'zod';
import type {
  CatalogFilters,
  CatalogParams,
  CatalogResult,
  CatalogSnapshot,
  CatalogTitle,
  PlaylistEpisode,
  TitleDetail,
  TitleStatus,
} from '../../entities/catalog';

const API_BASE = 'https://api.animetop.info/v1';
const PAGE_SIZE = 24;
const CATALOG_SORT_VALUES: CatalogParams['sort'][] = ['latest', 'trending', 'rating'];
const STATUS_VALUES: TitleStatus[] = ['Анонс', 'Онгоинг', 'Завершено'];

export const DEFAULT_CATALOG_PARAMS: CatalogParams = {
  page: 1,
  search: '',
  genre: '',
  status: '',
  year: '',
  type: '',
  sort: 'latest',
};

export interface CatalogSearchData {
  params: CatalogParams;
  result: CatalogResult;
  filters: CatalogFilters;
  generatedAt: string;
}

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
  searchText: z.string().transform((value) => normalizeSearchText(value)),
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

export interface HomeFeed {
  hero: CatalogTitle | null;
  latest: CatalogTitle[];
  trending: CatalogTitle[];
}

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

function normalizeSearchText(value: string): string {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-zа-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearch(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(' ') : [];
}

function normalizeCatalogPage(value: CatalogParams['page'] | string | null | undefined): number {
  const numeric = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(numeric)) return DEFAULT_CATALOG_PARAMS.page;
  return Math.max(1, Math.trunc(numeric));
}

function normalizeCatalogFilterValue(value: string | null | undefined, allowedValues?: readonly string[]): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  if (allowedValues && !allowedValues.includes(normalized)) return '';
  return normalized;
}

interface CatalogParamsInput {
  page?: CatalogParams['page'] | string | null;
  search?: string | null;
  genre?: string | null;
  status?: string | null;
  year?: string | null;
  type?: string | null;
  sort?: CatalogParams['sort'] | null;
}

export function normalizeCatalogParams(
  params: CatalogParamsInput,
  filters?: CatalogFilters,
): CatalogParams {
  const sort = CATALOG_SORT_VALUES.includes(params.sort ?? DEFAULT_CATALOG_PARAMS.sort)
    ? (params.sort ?? DEFAULT_CATALOG_PARAMS.sort)
    : DEFAULT_CATALOG_PARAMS.sort;

  return {
    page: normalizeCatalogPage(params.page),
    search: normalizeSearchText(params.search ?? DEFAULT_CATALOG_PARAMS.search),
    genre: normalizeCatalogFilterValue(params.genre, filters?.genres),
    status: normalizeCatalogFilterValue(params.status, filters?.statuses ?? STATUS_VALUES),
    year: normalizeCatalogFilterValue(params.year, filters?.years),
    type: normalizeCatalogFilterValue(params.type, filters?.types),
    sort,
  };
}

export function parseCatalogSearchParams(searchParams: URLSearchParams, filters?: CatalogFilters): CatalogParams {
  return normalizeCatalogParams({
    page: searchParams.get('page'),
    search: searchParams.get('q'),
    genre: searchParams.get('genre'),
    status: searchParams.get('status'),
    year: searchParams.get('year'),
    type: searchParams.get('type'),
    sort: searchParams.get('sort') as CatalogParams['sort'] | null,
  }, filters);
}

export function buildCatalogSearchParams(params: CatalogParams): URLSearchParams {
  const normalized = normalizeCatalogParams(params);
  const nextSearch = new URLSearchParams();

  if (normalized.search) nextSearch.set('q', normalized.search);
  if (normalized.genre) nextSearch.set('genre', normalized.genre);
  if (normalized.status) nextSearch.set('status', normalized.status);
  if (normalized.year) nextSearch.set('year', normalized.year);
  if (normalized.type) nextSearch.set('type', normalized.type);
  if (normalized.sort !== DEFAULT_CATALOG_PARAMS.sort) nextSearch.set('sort', normalized.sort);
  if (normalized.page > DEFAULT_CATALOG_PARAMS.page) nextSearch.set('page', String(normalized.page));

  return nextSearch;
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

function compareTrending(left: CatalogTitle, right: CatalogTitle): number {
  return right.trendingScore - left.trendingScore
    || right.votes - left.votes
    || right.averageScore - left.averageScore
    || left.latestRank - right.latestRank;
}

function getTrendingTitlesSlice(items: CatalogTitle[], limit: number): CatalogTitle[] {
  return [...items]
    .sort(compareTrending)
    .slice(0, limit);
}

export function selectHomeFeed(snapshot: CatalogSnapshot): HomeFeed {
  const latest = snapshot.items.slice(0, 12);
  return {
    hero: latest[0] ?? null,
    latest,
    trending: getTrendingTitlesSlice(snapshot.items, 12),
  };
}

function matchesSearch(title: CatalogTitle, searchTokens: string[]): boolean {
  if (searchTokens.length === 0) return true;
  return searchTokens.every((token) => title.searchText.includes(token));
}

function matchesFilters(title: CatalogTitle, params: CatalogParams): boolean {
  if (params.genre && !title.genres.includes(params.genre)) return false;
  if (params.status && title.status !== params.status) return false;
  if (params.year && title.year !== params.year) return false;
  if (params.type && title.type !== params.type) return false;
  return true;
}

function sortTitles(items: CatalogTitle[], sort: CatalogParams['sort']): CatalogTitle[] {
  const copy = [...items];
  if (sort === 'trending') {
    return copy.sort(compareTrending);
  }
  if (sort === 'rating') {
    return copy.sort((left, right) => right.averageScore - left.averageScore || right.votes - left.votes);
  }
  return copy.sort((left, right) => left.latestRank - right.latestRank);
}

function selectCatalogResults(snapshot: CatalogSnapshot, params: CatalogParams): CatalogResult {
  const searchTokens = tokenizeSearch(params.search);
  const filtered = sortTitles(
    snapshot.items.filter((title) => matchesSearch(title, searchTokens) && matchesFilters(title, params)),
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

export async function getCatalogResults(params: CatalogParams): Promise<CatalogResult> {
  const snapshot = await getCatalogSnapshot();
  const normalizedParams = normalizeCatalogParams(params, snapshot.filters);
  return selectCatalogResults(snapshot, normalizedParams);
}

export async function getCatalogSearchData(params: CatalogParams): Promise<CatalogSearchData> {
  const snapshot = await getCatalogSnapshot();
  const normalizedParams = normalizeCatalogParams(params, snapshot.filters);

  return {
    params: normalizedParams,
    result: selectCatalogResults(snapshot, normalizedParams),
    filters: snapshot.filters,
    generatedAt: snapshot.generatedAt,
  };
}

export async function getLatestTitles(limit = 12): Promise<CatalogTitle[]> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.items.slice(0, limit);
}

export async function getTrendingTitles(limit = 12): Promise<CatalogTitle[]> {
  const snapshot = await getCatalogSnapshot();
  return getTrendingTitlesSlice(snapshot.items, limit);
}

export async function getHomeFeed(): Promise<HomeFeed> {
  const snapshot = await getCatalogSnapshot();
  return selectHomeFeed(snapshot);
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
    .sort((left, right) => right.score - left.score || compareTrending(left.item, right.item))
    .slice(0, limit)
    .map((entry) => entry.item);
}
