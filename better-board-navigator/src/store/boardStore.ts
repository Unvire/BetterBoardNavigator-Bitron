import { create } from "zustand";
import type { BoardData } from "../types/board";

interface BoardState {
  boardData: BoardData | null;
  setBoardData: (data: BoardData | null) => void;

  // --- Canvas filters---
  currentSide: 'T' | 'B';
  toggleSide: () => void;
  showOutlines: boolean;
  toggleOutlines: () => void;
  showComponentNames: boolean;
  toggleComponentNames: () => void;

  // --- Selection ---
  selectedComponents: Set<string>;
  toggleComponentSelection: (compName: string) => void;
  selectComponents: (compNames: string[]) => void;
  clearComponentSelection: () => void;
  
  selectedNet: string | null;
  setSelectedNet: (netName: string | null) => void;
  
  selectedPrefix: string | null;
  setSelectedPrefix: (prefix: string | null) => void;

  // --- Light/Dark mode ---
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boardData: null,
  currentSide: 'T',
  showOutlines: true,
  showComponentNames: false,
  selectedComponents: new Set(),
  selectedNet: null,
  selectedPrefix: null,
  isDarkMode: true, 

  
  setBoardData: (data) => set({ boardData: data }),

  toggleSide: () => set((state) => ({ currentSide: state.currentSide === 'T' ? 'B' : 'T' })),
  
  toggleOutlines: () => set((state) => ({ showOutlines: !state.showOutlines })),
  
  toggleComponentNames: () => set((state) => ({ showComponentNames: !state.showComponentNames })),

  toggleComponentSelection: (compName) => set((state) => {
    const newSet = new Set(state.selectedComponents);
    if (newSet.has(compName)) {
      newSet.delete(compName);
    } else {
      newSet.add(compName);
    }
    return { selectedComponents: newSet };
  }),

  selectComponents: (compNames) => set(() => {
    return { selectedComponents: new Set(compNames) };
  }),

  clearComponentSelection: () => set({ selectedComponents: new Set() }),

  setSelectedNet: (netName) => set({ selectedNet: netName }),

  setSelectedPrefix: (prefix) => set({ selectedPrefix: prefix }),

  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newMode };
  }),
}));