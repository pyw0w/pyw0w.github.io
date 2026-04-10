import type { CatalogSourceId, CatalogTitle } from '../../entities/catalog';

const STORAGE_VERSION = 3;
const FAVORITES_KEY = 'av-player:favorites';
const HISTORY_KEY = 'av-player:history';
const EPISODE_KEY = 'av-player:episodes';
const PREFERRED_SOURCE_KEY = 'av-player:preferred-source';

interface VersionedStorage<T> {
  version: number;
  value: T;
}

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

function readVersioned<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as VersionedStorage<T>;
    if (typeof parsed !== 'object' || parsed === null || !('value' in parsed)) return fallback;
    return parsed.value;
  } catch {
    return fallback;
  }
}

function writeVersioned<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  const payload: VersionedStorage<T> = {
    version: STORAGE_VERSION,
    value,
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function getTitleStorageIds(title: Pick<CatalogTitle, 'id' | 'sources'>): string[] {
  return [title.id, ...title.sources.map((source) => source.legacyTitleId)];
}

export function matchesStoredTitleIds(title: Pick<CatalogTitle, 'id' | 'sources'>, ids: Set<string>): boolean {
  return getTitleStorageIds(title).some((id) => ids.has(id));
}

export function getFavorites(): FavoriteItem[] {
  return readVersioned<FavoriteItem[]>(FAVORITES_KEY, []);
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
  return readVersioned<HistoryItem[]>(HISTORY_KEY, []);
}

function buildEpisodeKey(titleId: string, sourceId: CatalogSourceId): string {
  return `${titleId}:${sourceId}`;
}

export function getSelectedEpisode(titleId: string, sourceId: CatalogSourceId, legacyTitleId?: string): string | null {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {});
  return map[buildEpisodeKey(titleId, sourceId)] ?? (legacyTitleId ? map[legacyTitleId] ?? null : null);
}

export function setSelectedEpisode(titleId: string, sourceId: CatalogSourceId, episodeId: string): void {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {});
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
