import { useQuery } from '@tanstack/react-query';
import { shikimori } from './shikimori';
import type { ShikimoriAnime } from './types';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => shikimori.fetchAnimes({ order: 'ranked', limit: '30', kind: 'tv' }),
  });
}

export function useSearch(term: string) {
  return useQuery({
    queryKey: ['search', term],
    enabled: term.trim().length > 1,
    queryFn: () => shikimori.fetchAnimes({ search: term, limit: '25' }),
  });
}

export function useAnime(id: string) {
  return useQuery({
    queryKey: ['anime', id],
    queryFn: () => shikimori.fetchAnimes({ ids: id, limit: '1' }).then((list) => list[0] ?? null),
  });
}
