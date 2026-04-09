import type { CatalogTitle } from '../../entities/catalog';

const STORAGE_VERSION = 1;
const FAVORITES_KEY = 'av-player:favorites';
const HISTORY_KEY = 'av-player:history';
const EPISODE_KEY = 'av-player:episodes';

interface VersionedStorage<T> {
  version: number;
  value: T;
}

interface FavoriteItem {
  id: number;
  slug: string;
  title: string;
  poster: string;
  addedAt: string;
}

interface HistoryItem {
  id: number;
  slug: string;
  title: string;
  poster: string;
  visitedAt: string;
}

type EpisodeMap = Record<string, string>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readVersioned<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as VersionedStorage<T>;
    if (parsed.version !== STORAGE_VERSION) return fallback;
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

export function getFavorites(): FavoriteItem[] {
  return readVersioned<FavoriteItem[]>(FAVORITES_KEY, []);
}

export function isFavorite(id: number): boolean {
  return getFavorites().some((item) => item.id === id);
}

export function toggleFavorite(title: Pick<CatalogTitle, 'id' | 'slug' | 'title' | 'poster'>): boolean {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === title.id);

  if (exists) {
    writeVersioned(
      FAVORITES_KEY,
      favorites.filter((item) => item.id !== title.id),
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
    ...favorites,
  ]);

  return true;
}

export function pushHistory(title: Pick<CatalogTitle, 'id' | 'slug' | 'title' | 'poster'>): void {
  const current = getHistory().filter((item) => item.id !== title.id);
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

export function getSelectedEpisode(titleId: number): string | null {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {});
  return map[String(titleId)] ?? null;
}

export function setSelectedEpisode(titleId: number, episodeId: string): void {
  const map = readVersioned<EpisodeMap>(EPISODE_KEY, {});
  map[String(titleId)] = episodeId;
  writeVersioned(EPISODE_KEY, map);
}
