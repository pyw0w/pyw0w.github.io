import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Entries = Record<string, Record<number, number>>;

interface ProgressState {
  entries: Entries;
  setPosition: (animeId: string, episode: number, seconds: number) => void;
  getPosition: (animeId: string, episode: number) => number;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: {},
      setPosition: (animeId, episode, seconds) =>
        set((s) => ({
          entries: { ...s.entries, [animeId]: { ...s.entries[animeId], [episode]: seconds } },
        })),
      getPosition: (animeId, episode) => get().entries[animeId]?.[episode] ?? 0,
    }),
    { name: 'watch_progress' },
  ),
);
