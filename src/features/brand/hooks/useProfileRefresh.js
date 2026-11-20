import { useCallback } from "react";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

/**
 * After any profile change: re-read the brand (GET /brands/get) and the
 * onboarding status, so profile strength, `items` and `editable` follow
 * (guide §11 — the server computes everything).
 * @param {(() => Promise<unknown>)|undefined} reloadBrand  useBrandData's `reload`
 * @returns {() => Promise<void>}
 */
export default function useProfileRefresh(reloadBrand) {
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  return useCallback(async () => {
    await Promise.all([
      reloadBrand?.(),
      fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err)),
    ]);
  }, [fetchStatus, reloadBrand]);
}
