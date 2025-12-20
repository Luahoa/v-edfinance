import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GamificationState {
  celebrations: string[]; // List of checklist IDs or titles already celebrated in this session
  addCelebration: (id: string) => void;
  hasCelebrated: (id: string) => boolean;
  clearCelebrations: () => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      celebrations: [],
      addCelebration: (id) =>
        set((state) => ({
          celebrations: [...state.celebrations, id],
        })),
      hasCelebrated: (id) => get().celebrations.includes(id),
      clearCelebrations: () => set({ celebrations: [] }),
    }),
    {
      name: 'gamification-storage',
    }
  )
);
