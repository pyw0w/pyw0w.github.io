export interface KodikTranslation {
  id: string;
  title: string;
  type: 'озвучка' | 'субтитры' | 'Неизвестно';
}

export interface StreamResult {
  manifest: string;
  qualities: number[];
}

export interface ShikimoriAnime {
  id: string;
  name: string;
  russian: string | null;
  image: { original: string | null; preview: string | null };
  score: string | null;
  episodes: number;
  episodesAired: number;
  kind: string | null;
  status: string | null;
  description: string | null;
}
