import { create } from 'zustand';
import type { BoardData } from '../types/board';

interface BoardState {
  boardData: BoardData | null;
  setBoardData: (data: BoardData) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showOutlines: boolean;
  toggleOutlines: () => void;
  
  currentSide: 'T' | 'B';
  setCurrentSide: (side: 'T' | 'B') => void;
  isMirrored: boolean;
  setIsMirrored: (mirrored: boolean) => void;

  // --- SELECTION ---
  selectedComponents: Set<string>;
  selectComponents: (names: string[], isMultiSelect?: boolean) => void;
  clearSelection: () => void;

  selectedNet: string | null;
  selectNet: (net: string | null) => void;

  // --- CAMERA / ZOOM ---
  componentToFocus: string | null;
  triggerFocus: (compName: string) => void;
  clearFocus: () => void;

  // --- 2ND SELECTION ---
  inspectedComponent: string | null;
  setInspectedComponent: (name: string | null) => void;

  // --- COMPONENT TYPES ---
  highlightedPrefix: string | null;
  setHighlightedPrefix: (prefix: string | null) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boardData: null,
  isDarkMode: true,
  showOutlines: true,
  
  currentSide: 'T',
  isMirrored: false,
  
  selectedComponents: new Set<string>(),
  selectedNet: null,
  componentToFocus: null,

  inspectedComponent: null,
  highlightedPrefix: null,


  setBoardData: (data) => set({ boardData: data }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  toggleOutlines: () => set((state) => ({ showOutlines: !state.showOutlines })),
  
  setCurrentSide: (side) => set({ currentSide: side }),
  
  setIsMirrored: (mirrored) => set({ isMirrored: mirrored }),

  selectComponents: (names, isMultiSelect = false) => set((state) => {
    if (isMultiSelect) {
      const newSelection = new Set(state.selectedComponents);
      names.forEach(name => {
        if (newSelection.has(name)) {
          newSelection.delete(name);
        } else {
          newSelection.add(name);
        }
      });
      return { 
        selectedComponents: newSelection,
      };
    }
    
    return { 
      selectedComponents: new Set(names)
    };
  }),

  clearSelection: () => set({ 
    selectedComponents: new Set(), 
    selectedNet: null,
    inspectedComponent: null,
    highlightedPrefix: null
  }),

  selectNet: (net) => set({ 
    selectedNet: net
  }),

  triggerFocus: (compName) => set({ componentToFocus: compName }),
  
  clearFocus: () => set({ componentToFocus: null }),

  setInspectedComponent: (name) => set({ 
    inspectedComponent: name, 
    highlightedPrefix: null
  }),

  setHighlightedPrefix: (prefix) => set({ 
    highlightedPrefix: prefix,
    inspectedComponent: null
  }),
}));