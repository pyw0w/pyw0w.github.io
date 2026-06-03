import { useQuery } from '@tanstack/react-query';
import { workerApi } from '../../api/worker';

interface KodikRaw {
  results?: Array<{
    translation?: { id: number; title: string; type: string };
    last_season?: number;
    episodes_count?: number;
    seasons?: Record<string, { episodes?: Record<string, string> }>;
  }>;
}

export interface KodikMatch {
  translations: Array<{ id: string; title: string; type: string }>;
  episodes: number;
}

export function useKodikMatch(shikimoriId: string) {
  return useQuery<KodikMatch>({
    queryKey: ['kodik-match', shikimoriId],
    queryFn: async () => {
      const raw = (await workerApi.search({ id: shikimoriId })) as KodikRaw;
      const results = raw.results ?? [];
      const seen = new Set<string>();
      const translations: KodikMatch['translations'] = [];
      let episodes = 0;
      for (const r of results) {
        if (r.translation) {
          const id = String(r.translation.id);
          if (!seen.has(id)) {
            seen.add(id);
            translations.push({ id, title: r.translation.title, type: r.translation.type });
          }
        }
        episodes = Math.max(episodes, r.episodes_count ?? 0);
      }
      return { translations, episodes: episodes || 1 };
    },
  });
}
