export type TitleStatus = 'Анонс' | 'Онгоинг' | 'Завершено';

export interface CatalogTitle {
  id: number;
  slug: string;
  title: string;
  originalTitle: string;
  fullTitle: string;
  episodeLabel: string;
  badges: string[];
  year: string;
  genres: string[];
  type: string;
  director: string;
  poster: string;
  screens: string[];
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
}

export interface PlaylistEpisode {
  id: string;
  name: string;
  hd: string;
  std: string;
  preview: string;
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
