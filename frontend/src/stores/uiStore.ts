import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  toggleSidebar: () => void;
  toggleCartDrawer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  cartDrawerOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),
}));