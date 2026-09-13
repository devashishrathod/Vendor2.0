import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Local-only appearance preference (light/dark). There's no confirmed
// backend endpoint for this, and no dark-mode styling exists anywhere else
// in the app yet — this store just remembers the vendor's choice on this
// device (persisted to localStorage) so the Settings page's own preview
// reflects it across reloads.
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'trydood-theme' }
  )
);
