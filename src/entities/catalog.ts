export type TitleStatus = 'Анонс' | 'Онгоинг' | 'Завершено';
export type CatalogSourceId = 'animetop' | 'anidub';

export interface CatalogTitleSource {
  sourceId: CatalogSourceId;
  sourceTitleId: string;
  legacyTitleId: string;
  legacySlug: string;
  title: string;
  originalTitle: string;
  episodeLabel: string;
  status: TitleStatus;
  isAnnouncement: boolean;
  releasedEpisodes: number | null;
  totalEpisodes: number | null;
  latestRank: number;
}

export interface CatalogTitle {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  episodeLabel: string;
  year: string;
  genres: string[];
  type: string;
  director: string;
  poster: string;
  shortDescription: string;
  rating: number;
  votes: number;
  averageScore: number;
  trendingScore: number;
  timer: number;
  isAnnouncement: boolean;
  status: TitleStatus;
  releasedEpisodes: number | null;
  totalEpisodes: number | null;
  latestRank: number;
  searchText: string;
  primarySourceId: CatalogSourceId;
  sources: CatalogTitleSource[];
}

export interface CatalogFilters {
  genres: string[];
  years: string[];
  types: string[];
  statuses: TitleStatus[];
}

export interface CatalogSnapshot {
  generatedAt: string;
  totalCount: number;
  filters: CatalogFilters;
  items: CatalogTitle[];
}

export interface TitleDetail extends CatalogTitle {
  description: string;
  selectedSourceId: CatalogSourceId;
  playerUrl?: string;
  playbackUnsupported?: boolean;
  playbackMessage?: string;
}

export interface PlaylistEpisode {
  id: string;
  name: string;
  hd: string;
  std: string;
  preview: string;
  playerUrl?: string;
  playbackUnsupported?: boolean;
  playbackMessage?: string;
}

export interface CatalogParams {
  page: number;
  search: string;
  genre: string;
  status: string;
  year: string;
  type: string;
  sort: 'latest' | 'trending' | 'rating';
}

export interface CatalogResult {
  items: CatalogTitle[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
