import { useAuthStore } from "../store/authStore";

/**
 * True once the vendor has finished onboarding — the logged-in user's
 * `isOnBoardingCompleted` flag, or (in case the stored user object predates
 * that field) the onboarding screen having reached DASHBOARD. Onboarding-
 * only screens like Create Outlet (/brand-outlet) must never be shown then.
 * @param {{ user?: { isOnBoardingCompleted?: boolean } | null, currentScreen?: string }} auth
 * @returns {boolean}
 */
export function isOnboardingComplete({ user, currentScreen } = {}) {
  return user?.isOnBoardingCompleted === true || currentScreen === "DASHBOARD";
}

/** Same check against the current auth store state (for non-React code / handlers). */
export function isOnboardingCompleteNow() {
  return isOnboardingComplete(useAuthStore.getState());
}
