import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, FileSignature, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { getErrorCode } from "@/services/http/apiError";
import { routeForScreen } from "../../config/routes";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { acceptPartnership } from "../../services/onboardingApi";
import { useOnboardingStatusStore } from "../../store/statusStore";
import Button from "../ui/Button";
import FormError from "../ui/FormError";
import DeedContent, { DeedAgreeCheckbox } from "./DeedContent";

/**
 * Deed confirmation popup (guide §5): shown when
 * `status.deed.requiresDeedConfirmation` is true — an admin recorded the deed
 * offline and the vendor hasn't confirmed it. Blocking: shown over every page
 * (dashboard too) and it can't be dismissed; the only other way out is
 * logging out. Confirm → PUT accept-partnership (screen unchanged) → read the
 * status again → go to its `currentScreen`.
 */
export default function DeedConfirmationModal() {
  const navigate = useNavigate();
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const logout = useAuthStore((s) => s.logout);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The page behind must not scroll while the popup blocks it.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const refreshAndRoute = useCallback(async () => {
    const status = await fetchStatus();
    navigate(routeForScreen(status?.currentScreen), { replace: true });
  }, [fetchStatus, navigate]);

  const handleConfirm = useCallback(async () => {
    if (!agreed || busy) return;
    setBusy(true);
    setError("");
    try {
      await acceptPartnership();
      await refreshAndRoute();
    } catch (err) {
      // Already confirmed (e.g. in another tab): the route answers 409
      // ONBOARDING_SCREEN_MISMATCH — the fresh status closes this popup.
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.SCREEN_MISMATCH) {
        await refreshAndRoute().catch((refreshError) => setError(refreshError?.message || "Please refresh the page."));
      } else {
        console.error("Deed confirmation failed:", err);
        setError(err?.message || "We couldn't confirm the agreement. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }, [agreed, busy, refreshAndRoute]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center font-sans sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="deed-confirm-title">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-900">
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
            <FileSignature size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="deed-confirm-title" className="text-base font-extrabold text-gray-900 dark:text-gray-50">
              Please confirm your partner agreement
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-gray-500 dark:text-gray-400">
              Our team recorded your signed agreement on your behalf. Confirm it to continue using the panel.
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
          <DeedContent />
          <DeedAgreeCheckbox checked={agreed} onChange={setAgreed} />
          <FormError message={error} />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3.5 sm:px-6 dark:border-gray-800 dark:bg-gray-900/60">
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
          <Button onClick={handleConfirm} disabled={!agreed} loading={busy} icon={Check} iconPosition="start">
            {busy ? "Confirming…" : "Confirm agreement"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
