import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useProgress = create()(persist((set, get) => ({
    entries: {},
    setPosition: (animeId, episode, seconds) => set((s) => ({
        entries: { ...s.entries, [animeId]: { ...s.entries[animeId], [episode]: seconds } },
    })),
    getPosition: (animeId, episode) => get().entries[animeId]?.[episode] ?? 0,
}), { name: 'watch_progress' }));
