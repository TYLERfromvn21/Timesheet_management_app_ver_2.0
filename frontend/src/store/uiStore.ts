//frontend/src/store/uiStore.ts
// this file is used to manage UI state such as global loading indicator, modals, notifications, etc.
import { create } from 'zustand';

//interface defining the shape of the UI store state
interface UiState {
  globalLoading: boolean;
  setGlobalLoading: (status: boolean) => void;
  
  notification: { type: 'success' | 'error', message: string } | null;
  showNotification: (type: 'success' | 'error', message: string) => void;
  clearNotification: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  globalLoading: false,
  setGlobalLoading: (status) => set({ globalLoading: status }),

  notification: null,
  showNotification: (type, message) => {
    set({ notification: { type, message } });
    setTimeout(() => set({ notification: null }), 3000); // auto-clear after 3 seconds
  },
  clearNotification: () => set({ notification: null })
}));