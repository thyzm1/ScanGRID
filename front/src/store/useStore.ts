import { create } from 'zustand';
import type { Drawer, Bin, Category } from '../types/api';

export type ViewMode = '2D' | '3D' | 'organizer' | 'settings' | 'bom' | 'bom-import';
export type EditMode = 'view' | 'edit';

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // View modes
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  removeCategory: (id: string) => void;

  // Search & Filter
  filterText: string;
  setFilterText: (text: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;

  // Drawers
  drawers: Drawer[];
  setDrawers: (drawers: Drawer[]) => void;
  addDrawer: (drawer: Drawer) => void;
  updateDrawer: (drawer: Drawer) => void;
  removeDrawer: (drawerId: string) => void;

  // Current drawer being edited
  currentDrawer: Drawer | null;
  setCurrentDrawer: (drawer: Drawer | null, preserveLayerIndex?: boolean) => void;

  // Current layer being edited
  currentLayerIndex: number;
  setCurrentLayerIndex: (index: number) => void;

  // Selected bin (for highlighting)
  selectedBin: Bin | null;
  setSelectedBin: (bin: Bin | null) => void;

  // Searched bin (for dimming others)
  searchedBinId: string | null;
  setSearchedBinId: (id: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Theme
  darkMode:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches,

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newDarkMode);
      }
      return { darkMode: newDarkMode };
    }),

  // View modes
  viewMode: '2D',
  setViewMode: (mode) => set({ viewMode: mode }),

  editMode: 'view',
  setEditMode: (mode) => set({ editMode: mode }),

  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  removeCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

  filterText: '',
  setFilterText: (text) => set({ filterText: text }),
  selectedCategoryId: null,
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  // Drawers
  drawers: [],
  setDrawers: (drawers) => set({ drawers }),
  addDrawer: (drawer) =>
    set((state) => ({ drawers: [...state.drawers, drawer] })),
  updateDrawer: (drawer) =>
    set((state) => ({
      drawers: state.drawers.map((d) =>
        d.drawer_id === drawer.drawer_id ? drawer : d
      ),
      currentDrawer:
        state.currentDrawer?.drawer_id === drawer.drawer_id
          ? drawer
          : state.currentDrawer,
    })),
  removeDrawer: (drawerId) =>
    set((state) => ({
      drawers: state.drawers.filter((d) => d.drawer_id !== drawerId),
      currentDrawer:
        state.currentDrawer?.drawer_id === drawerId
          ? null
          : state.currentDrawer,
    })),

  // Current drawer
  currentDrawer: null,
  setCurrentDrawer: (drawer, preserveLayerIndex = false) => {
    set((state) => {
      // Logic:
      // 1. If explicit preserve flag is passed, trust it (used when updating drawer content).
      // 2. If no flag, check if drawer IDs match. If they match, preserve.
      // 3. If new drawer, reset to 0.

      const idsMatch = state.currentDrawer?.drawer_id === drawer?.drawer_id;
      const shouldPreserve = preserveLayerIndex || idsMatch;

      const nextLayerIndex = shouldPreserve ? state.currentLayerIndex : 0;
      const syncedDrawers = drawer
        ? state.drawers.some((d) => d.drawer_id === drawer.drawer_id)
          ? state.drawers.map((d) => (d.drawer_id === drawer.drawer_id ? drawer : d))
          : [...state.drawers, drawer]
        : state.drawers;

      // Persist to local storage
      if (drawer) {
        localStorage.setItem('scangrid_last_drawer_id', drawer.drawer_id);
        localStorage.setItem('scangrid_last_layer_index', nextLayerIndex.toString());
      } else {
        localStorage.removeItem('scangrid_last_drawer_id');
        localStorage.removeItem('scangrid_last_layer_index');
      }

      return {
        drawers: syncedDrawers,
        currentDrawer: drawer,
        currentLayerIndex: nextLayerIndex,
        // Only clear selection if switching drawers completely
        selectedBin: shouldPreserve ? state.selectedBin : null,
        searchedBinId: shouldPreserve ? state.searchedBinId : null
      };
    });
  },

  // Current layer
  currentLayerIndex: 0,
  setCurrentLayerIndex: (index) => {
    // Persist to local storage
    localStorage.setItem('scangrid_last_layer_index', index.toString());
    set({ currentLayerIndex: index, selectedBin: null, searchedBinId: null });
  },

  // Selected bin
  selectedBin: null,
  setSelectedBin: (bin) => set({ selectedBin: bin }),

  // Searched bin
  searchedBinId: null,
  setSearchedBinId: (id) => set({ searchedBinId: id }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
