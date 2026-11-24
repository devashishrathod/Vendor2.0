import { create } from "zustand";
import { getOnboardingStatus } from "../services/onboardingApi";

// Onboarding v2 — the server's onboarding status (GET /brands/onboarding/status,
// API doc #20a): current screen, sidebar groups, progress, what is editable,
// limits, deed and strength. It is the only source of routing. Not persisted:
// it is read again after login and every time the panel opens (guide §2.3).

let inFlight = null;

/**
 * @typedef {Object} StatusState
 * @property {import('../types').OnboardingStatus|null} status
 * @property {boolean} loading
 * @property {unknown} error
 * @property {string|null} viewScreen  an earlier screen opened from Back (panel-only)
 */

export const useOnboardingStatusStore = create((set, get) => ({
  status: null,
  loading: false,
  error: null,
  viewScreen: null,

  /**
   * Reads the status. Parallel callers share one request.
   * @returns {Promise<import('../types').OnboardingStatus>}
   */
  fetchStatus: () => {
    if (inFlight) return inFlight;
    set({ loading: true, error: null });
    inFlight = getOnboardingStatus()
      .then((res) => {
        const status = res?.data ?? null;
        set({ status, loading: false });
        return status;
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

  /**
   * A save / skip / continue answered with `currentScreen` — show that screen
   * straight away, then refresh the rest (groups, progress, editable…).
   * @param {string} screen
   */
  applyScreen: (screen) => {
    set((s) => ({ viewScreen: null, status: s.status ? { ...s.status, currentScreen: screen } : s.status }));
    get()
      .fetchStatus()
      .catch((error) => console.error("Onboarding status refresh failed:", error));
  },

  /** Opens an earlier screen (Back). The server's screen does not change. */
  openScreen: (screen) => set({ viewScreen: screen }),

  /**
   * Returns from an earlier screen to the server's current one, and re-reads
   * the status: that screen may have saved through its own APIs (features,
   * albums, documents…), which change strength and checks without a
   * `currentScreen` response.
   */
  closeScreen: () => {
    set({ viewScreen: null });
    get()
      .fetchStatus()
      .catch((error) => console.error("Onboarding status refresh failed:", error));
  },

  reset: () => set({ status: null, loading: false, error: null, viewScreen: null }),
}));

/** @param {StatusState} s */
export const selectCurrentScreen = (s) => s.status?.currentScreen ?? null;

/** @param {StatusState} s */
export const selectLimits = (s) => s.status?.limits ?? null;

/** @param {StatusState} s */
export const selectKycPath = (s) => s.status?.kycPath ?? null;

/**
 * Onboarding is finished once the server says so (approved and acknowledged).
 * @param {import('../types').OnboardingStatus|null} status
 */
export const isOnboardingDone = (status) => status?.isOnBoardingCompleted === true || status?.currentScreen === "DASHBOARD";
