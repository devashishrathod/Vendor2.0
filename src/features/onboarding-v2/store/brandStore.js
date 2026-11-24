import { useEffect } from "react";
import { create } from "zustand";
import { getBrand } from "../services/onboardingApi";

// The brand as saved on the server (GET /brands/get, API doc #31) — screens
// prefill from it, so nothing is typed twice (guide §2.8). The response is
// heavy, so it is read once and refreshed after saves.

let inFlight = null;

export const useSavedBrandStore = create((set, get) => ({
  brand: null,
  loading: false,
  error: null,

  /**
   * @param {{ force?: boolean }} [options]
   * @returns {Promise<object|null>}
   */
  load: ({ force = false } = {}) => {
    if (!force && get().brand) return Promise.resolve(get().brand);
    if (inFlight) return inFlight;
    set({ loading: true, error: null });
    inFlight = getBrand()
      .then((res) => {
        const brand = res?.data ?? null;
        set({ brand, loading: false });
        return brand;
      })
      .catch((error) => {
        set({ error, loading: false });
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  },

  /** Merges the `brand` part of a save response (add / update-basic-details). */
  mergeBrand: (partial) => {
    if (!partial) return;
    set((s) => ({ brand: s.brand ? { ...s.brand, ...partial } : s.brand }));
  },

  reset: () => set({ brand: null, loading: false, error: null }),
}));

/**
 * The saved brand for prefilling a screen; loads it on first use.
 * @returns {{ brand: object|null, loading: boolean, error: unknown }}
 */
export function useSavedBrand() {
  const brand = useSavedBrandStore((s) => s.brand);
  const loading = useSavedBrandStore((s) => s.loading);
  const error = useSavedBrandStore((s) => s.error);
  const load = useSavedBrandStore((s) => s.load);

  useEffect(() => {
    load().catch((err) => console.error("Brand fetch failed:", err));
  }, [load]);

  return { brand, loading: loading || (!brand && !error), error };
}
