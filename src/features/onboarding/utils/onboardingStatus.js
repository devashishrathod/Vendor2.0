import { isOnboardingDone, useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

/**
 * True once the server says onboarding is finished (status
 * `isOnBoardingCompleted`, or `currentScreen` DASHBOARD). Onboarding-only
 * screens like Create Outlet (/brand-outlet) must never be shown then.
 * @param {import('@/features/onboarding-v2/types').OnboardingStatus|null} status
 * @returns {boolean}
 */
export function isOnboardingComplete(status) {
  return isOnboardingDone(status);
}

/** Same check against the current status store (for non-React code / handlers). */
export function isOnboardingCompleteNow() {
  return isOnboardingDone(useOnboardingStatusStore.getState().status);
}
