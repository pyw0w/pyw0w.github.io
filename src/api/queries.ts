import { useQuery } from '@tanstack/react-query';
import { shikimori } from './shikimori';
import type { ShikimoriAnime } from './types';

const ANIME_FIELDS = `
  id name russian score episodes episodesAired kind status
  image { original preview } description
`;

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query { animes(order: ranked, limit: 30, kind: "tv") { ${ANIME_FIELDS} } }`,
      );
      return data.animes;
    },
  });
}

export function useSearch(term: string) {
  return useQuery({
    queryKey: ['search', term],
    enabled: term.trim().length > 1,
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query($q: String!) { animes(search: $q, limit: 25) { ${ANIME_FIELDS} } }`,
        { q: term },
      );
      return data.animes;
    },
  });
}

export function useAnime(id: string) {
  return useQuery({
    queryKey: ['anime', id],
    queryFn: async () => {
      const data = await shikimori.graphql<{ animes: ShikimoriAnime[] }>(
        `query($id: String!) { animes(ids: $id, limit: 1) { ${ANIME_FIELDS} } }`,
        { id },
      );
      return data.animes[0] ?? null;
    },
  });
}
