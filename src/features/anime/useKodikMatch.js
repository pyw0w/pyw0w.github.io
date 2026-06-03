import { useQuery } from '@tanstack/react-query';
import { workerApi } from '../../api/worker';
export function useKodikMatch(shikimoriId) {
    return useQuery({
        queryKey: ['kodik-match', shikimoriId],
        queryFn: async () => {
            const raw = (await workerApi.search({ id: shikimoriId }));
            const results = raw.results ?? [];
            const seen = new Set();
            const translations = [];
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
