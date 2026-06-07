import { create } from 'zustand';

interface CategoryNavState {
  activeId: string;
  setActiveId: (id: string) => void;
  reset: () => void;
}

export const useCategoryNavStore = create<CategoryNavState>((set) => ({
  activeId: 'inicio',
  setActiveId: (id) => set({ activeId: id }),
  reset: () => set({ activeId: 'inicio' }),
}));
