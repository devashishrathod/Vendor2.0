import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import { useSavedBrandStore } from "@/features/onboarding-v2/store/brandStore";

/** Fired on `window` when a push notification arrives — the bell reloads. */
export const NOTIFICATION_EVENT = "trydood:notification";

/** Tells open notification lists that something new arrived. */
export function announceNotification() {
  window.dispatchEvent(new Event(NOTIFICATION_EVENT));
}

/**
 * A review / legal-details / document / outlet notice (e.g. approved,
 * rejected, BRAND_DETAILS_UPDATED_BY_ADMIN, OUTLET_ON_OLD_OWNER_NUMBER) →
 * read the onboarding status and the saved brand again, so banners,
 * `editable` and strength follow the server.
 */
export function refreshProfileAfterNotice() {
  useOnboardingStatusStore
    .getState()
    .fetchStatus()
    .catch((err) => console.error("Onboarding status refresh failed:", err));
  if (useSavedBrandStore.getState().brand) {
    useSavedBrandStore
      .getState()
      .load({ force: true })
      .catch((err) => console.error("Brand refresh failed:", err));
  }
}
