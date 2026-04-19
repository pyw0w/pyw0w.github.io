import { useSyncExternalStore } from 'react';
import type { CatalogSourceId, CatalogTitle } from '../../entities/catalog';

const STORAGE_VERSION = 3;
const FAVORITES_KEY = 'av-player:favorites';
const HISTORY_KEY = 'av-player:history';
const EPISODE_KEY = 'av-player:episodes';
const PREFERRED_SOURCE_KEY = 'av-player:preferred-source';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function subscribe(key: string, listener: Listener): () => void {
  let bucket = listeners.get(key);
  if (!bucket) {
    bucket = new Set();
    listeners.set(key, bucket);
  }
  bucket.add(listener);
  return () => {
    bucket?.delete(listener);
  };
}

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key) {
      listeners.forEach((_bucket, key) => notify(key));
      return;
    }
    if (listeners.has(event.key)) notify(event.key);
  });
}

interface VersionedStorage<T> {
  version: number;
  value: T;
}

type MigrationFn<T> = (version: number, value: unknown) => T | null;

export interface FavoriteItem {
  id: string;
  slug: string;
  title: string;
  poster: string;
  addedAt: string;
}

export interface HistoryItem {
  id: string;
  slug: string;
  title: string;
  poster: string;
  visitedAt: string;
}

type EpisodeMap = Record<string, string>;
type PreferredSourceMap = Record<string, CatalogSourceId>;

type StoredTitleIdentity = Pick<CatalogTitle, 'id' | 'slug' | 'title' | 'poster' | 'sources'>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseVersionedStorage<T>(raw: string): VersionedStorage<T> | null {
  try {
    const parsed = JSON.parse(raw) as VersionedStorage<T>;
    if (!isRecord(parsed) || typeof parsed.version !== 'number' || !('value' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeStoredTitleId(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return `animetop-${Math.trunc(value)}`;
  return null;
}

function migrateFavorites(version: number, value: unknown): FavoriteItem[] | null {
  if (version !== 1 && version !== 2) return null;
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = normalizeStoredTitleId(item.id);
    if (!id) return [];

    return [{
      id,
      slug: typeof item.slug === 'string' ? item.slug : '',
      title: typeof item.title === 'string' ? item.title : '',
      poster: typeof item.poster === 'string' ? item.poster : '',
      addedAt: typeof item.addedAt === 'string' ? item.addedAt : '',
    }];
  });
}

function migrateHistory(version: number, value: unknown): HistoryItem[] | null {
  if (version !== 1 && version !== 2) return null;
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = normalizeStoredTitleId(item.id);
    if (!id) return [];

    return [{
      id,
      slug: typeof item.slug === 'string' ? item.slug : '',
      title: typeof item.title === 'string' ? item.title : '',
      poster: typeof item.poster === 'string' ? item.poster : '',
      visitedAt: typeof item.visitedAt === 'string' ? item.visitedAt : '',
    }];
  });
}

function migrateEpisodes(version: number, value: unknown): EpisodeMap | null {
  if (version !== 1 && version !== 2) return null;
  if (!isRecord(value)) return null;

  return Object.entries(value).reduce<EpisodeMap>((result, [key, episodeId]) => {
    if (typeof episodeId !== 'string' || !episodeId) return result;
    if (version === 1 && /^\d+$/.test(key)) {
      result[`animetop-${key}:animetop`] = episodeId;
      return result;
    }

    result[key] = episodeId;
    return result;
  }, {});
}

function readVersioned<T>(key: string, fallback: T, migrate?: MigrationFn<T>): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  const parsed = parseVersionedStorage<T>(raw);
  if (!parsed) return fallback;
  if (parsed.version === STORAGE_VERSION) return parsed.value;
  if (!migrate) return fallback;

  const migrated = migrate(parsed.version, parsed.value);
  if (migrated === null) return fallback;

  writeVersioned(key, migrated);
  return migrated;
}

function writeVersioned<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  const payload: VersionedStorage<T> = {
    version: STORAGE_VERSION,
    value,
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
  notify(key);
}

export function getTitleStorageIds(title: Pick<CatalogTitle, 'id' | 'sources'>): string[] {
  return [title.id, ...title.sources.map((source) => source.legacyTitleId)];
}

export function matchesStoredTitleIds(title: Pick<CatalogTitle, 'id' | 'sources'>, ids: Set<string>): boolean {
  return getTitleStorageIds(title).some((id) => ids.has(id));
}

export function getFavorites(): FavoriteItem[] {
  return readVersioned<FavoriteItem[]>(FAVORITES_KEY, [], migrateFavorites);
}

export function isFavorite(title: string | StoredTitleIdentity): boolean {
  const favoriteIds = new Set(getFavorites().map((item) => item.id));
  if (typeof title === 'string') return favoriteIds.has(title);
  return matchesStoredTitleIds(title, favoriteIds);
}

export function toggleFavorite(title: StoredTitleIdentity): boolean {
  const favorites = getFavorites();
  const titleIds = new Set(getTitleStorageIds(title));
  const exists = favorites.some((item) => titleIds.has(item.id));

  if (exists) {
    writeVersioned(
      FAVORITES_KEY,
      favorites.filter((item) => !titleIds.has(item.id)),
    );
    return false;
  }

  writeVersioned(FAVORITES_KEY, [
    {
      id: title.id,
      slug: title.slug,
      title: title.title,
      poster: title.poster,
      addedAt: new Date().toISOString(),
    },
    ...favorites.filter((item) => !titleIds.has(item.id)),
  ]);

  return true;
}

export function pushHistory(title: StoredTitleIdentity): void {
  const titleIds = new Set(getTitleStorageIds(title));
  const current = getHistory().filter((item) => !titleIds.has(item.id));
  const next: HistoryItem[] = [
    {
      id: title.id,
      slug: title.slug,
      title: title.title,
      poster: title.poster,
      visitedAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 30);

  writeVersioned(HISTORY_KEY, next);
}

export function getHistory(): HistoryItem[] {
  return readVersioned<HistoryItem[]>(HISTORY_KEY, [], migrateHistory);
}

function buildEpisodeKey(titleId: string, sourceId: CatalogSourceId): string {
  return `${titleId}:${sourceId}`;
}

export function getSelectedEpisode(titleId: string, sourceId: CatalogSourceId, legacyTitleId?: string): string | null {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {}, migrateEpisodes);
  return map[buildEpisodeKey(titleId, sourceId)] ?? (legacyTitleId ? map[legacyTitleId] ?? null : null);
}

export function setSelectedEpisode(titleId: string, sourceId: CatalogSourceId, episodeId: string): void {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {}, migrateEpisodes);
  map[buildEpisodeKey(titleId, sourceId)] = episodeId;
  writeVersioned(EPISODE_KEY, map);
}

export function getPreferredSourceId(titleId: string): CatalogSourceId | null {
  const map = readVersioned<PreferredSourceMap>(PREFERRED_SOURCE_KEY, {});
  return map[titleId] ?? null;
}

export function setPreferredSourceId(titleId: string, sourceId: CatalogSourceId): void {
  const map = readVersioned<PreferredSourceMap>(PREFERRED_SOURCE_KEY, {});
  map[titleId] = sourceId;
  writeVersioned(PREFERRED_SOURCE_KEY, map);
}

const EMPTY_FAVORITES: FavoriteItem[] = [];
const EMPTY_HISTORY: HistoryItem[] = [];

let favoritesSnapshot: FavoriteItem[] | null = null;
let favoritesSnapshotSerialized: string | null = null;
let historySnapshot: HistoryItem[] | null = null;
let historySnapshotSerialized: string | null = null;

function refreshSnapshot<T>(
  current: T | null,
  currentSerialized: string | null,
  next: T,
): { value: T; serialized: string } {
  const serialized = JSON.stringify(next);
  if (current && currentSerialized === serialized) {
    return { value: current, serialized: currentSerialized };
  }
  return { value: next, serialized };
}

function getFavoritesSnapshot(): FavoriteItem[] {
  const next = getFavorites();
  const { value, serialized } = refreshSnapshot(favoritesSnapshot, favoritesSnapshotSerialized, next);
  favoritesSnapshot = value;
  favoritesSnapshotSerialized = serialized;
  return value;
}

function getHistorySnapshot(): HistoryItem[] {
  const next = getHistory();
  const { value, serialized } = refreshSnapshot(historySnapshot, historySnapshotSerialized, next);
  historySnapshot = value;
  historySnapshotSerialized = serialized;
  return value;
}

export function useFavorites(): FavoriteItem[] {
  return useSyncExternalStore(
    (listener) => subscribe(FAVORITES_KEY, listener),
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES,
  );
}

export function useHistory(): HistoryItem[] {
  return useSyncExternalStore(
    (listener) => subscribe(HISTORY_KEY, listener),
    getHistorySnapshot,
    () => EMPTY_HISTORY,
  );
}
