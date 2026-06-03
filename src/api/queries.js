import { useQuery } from '@tanstack/react-query';
import { shikimori } from './shikimori';
const ANIME_FIELDS = `
  id name russian score episodes episodesAired kind status
  image { original preview } description
`;
export function useCatalog() {
    return useQuery({
        queryKey: ['catalog'],
        queryFn: async () => {
            const data = await shikimori.graphql(`query { animes(order: ranked, limit: 30, kind: "tv") { ${ANIME_FIELDS} } }`);
            return data.animes;
        },
    });
}
export function useSearch(term) {
    return useQuery({
        queryKey: ['search', term],
        enabled: term.trim().length > 1,
        queryFn: async () => {
            const data = await shikimori.graphql(`query($q: String!) { animes(search: $q, limit: 25) { ${ANIME_FIELDS} } }`, { q: term });
            return data.animes;
        },
    });
}
export function useAnime(id) {
    return useQuery({
        queryKey: ['anime', id],
        queryFn: async () => {
            const data = await shikimori.graphql(`query($id: String!) { animes(ids: $id, limit: 1) { ${ANIME_FIELDS} } }`, { id });
            return data.animes[0] ?? null;
        },
    });
}
