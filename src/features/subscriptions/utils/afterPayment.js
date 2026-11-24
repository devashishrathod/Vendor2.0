import { routeForScreen } from "@/features/onboarding-v2/config/routes";
import { SCREENS } from "@/features/onboarding-v2/config/screens";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

const RETRIES = 3;
const RETRY_DELAY_MS = 1500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Where an onboarding vendor goes after the plan is bought: the page for the
 * server's `currentScreen` (guide §4.11 — a live plan moves it to
 * BRAND_BASIC_DETAILS). A webhook activation can land a moment later, so the
 * status is re-read a few times while it still says SUBSCRIBE_PLAN.
 * @returns {Promise<string>} route
 */
export async function routeAfterPlanPurchase() {
  const { fetchStatus } = useOnboardingStatusStore.getState();
  let screen = null;
  for (let attempt = 0; attempt < RETRIES; attempt += 1) {
    if (attempt > 0) await wait(RETRY_DELAY_MS);
    try {
      screen = (await fetchStatus())?.currentScreen ?? null;
    } catch (error) {
      console.error("Onboarding status fetch after payment failed:", error);
    }
    if (screen && screen !== SCREENS.SUBSCRIBE_PLAN) break;
  }
  return routeForScreen(screen);
}
