import { useCallback, useEffect } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStatusStore } from "../store/statusStore";
import DeedConfirmationModal from "./deed/DeedConfirmationModal";

/**
 * Logged-in pages wait for GET /brands/onboarding/status — read every time
 * the panel opens (guide §2.3) — because routing comes only from it; a
 * pending deed confirmation then blocks every page with a popup. Logged out,
 * the children render straight away.
 * @param {{ children: import('react').ReactNode }} props
 */
export default function StatusGate({ children }) {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const status = useOnboardingStatusStore((s) => s.status);
  const error = useOnboardingStatusStore((s) => s.error);
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);

  const load = useCallback(() => {
    fetchStatus().catch((err) => console.error("Onboarding status fetch failed:", err));
  }, [fetchStatus]);

  useEffect(() => {
    if (token && !status) load();
  }, [load, status, token]);

  if (!token) return children;
  if (status) {
    return (
      <>
        {children}
        {/* Blocking, over every page — dashboard too (guide §5). */}
        {status.deed?.requiresDeedConfirmation && <DeedConfirmationModal />}
      </>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-app px-4 font-sans dark:bg-gray-950">
      {error ? (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center" role="alert">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">We couldn&apos;t load your onboarding progress.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error?.message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <RotateCw size={15} aria-hidden="true" />
              Try again
            </button>
            <button
              type="button"
              onClick={logout}
              className="min-h-10 rounded-xl px-4 text-sm font-semibold text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800"
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400" role="status">
          <LoaderCircle size={18} className="animate-spin text-emerald-600" aria-hidden="true" />
          Loading your progress…
        </p>
      )}
    </div>
  );
}
