import { useEffect, useState } from "react";
import { ArrowRight, MessageSquareText, PartyPopper } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { acknowledgeBrandApproval, getVerificationHistory } from "../../services/onboardingApi";
import { useSavedBrand } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";

/**
 * Approved, not yet seen (guide §7.3): congratulations (with our team's
 * note — the newest APPROVED history row's `reason`), then "Continue" →
 * PUT acknowledge-approval → DASHBOARD. Also after a re-approval (the
 * vendor is already on DASHBOARD). 409 = the approval changed meanwhile →
 * the status is read again and the page follows it.
 */
export default function ApprovedView() {
  const { goToServerScreen } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    getVerificationHistory()
      .then((rows) => setNote(rows.find((row) => row.action === "APPROVED")?.reason || ""))
      .catch((err) => console.error("Verification history fetch failed:", err));
  }, []);

  const handleContinue = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await acknowledgeBrandApproval();
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      console.error("Acknowledge approval failed:", err);
      setError(onboardingErrorMessage(err, "That didn't work. Please try again."));
      goToServerScreen(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] sm:px-10 sm:py-14 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500 shadow-[0_0_0_8px_#F4FBF7] ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:shadow-none dark:ring-emerald-500/30">
        <PartyPopper size={30} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-[28px] dark:text-gray-50">Congratulations!</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
        Our team has approved {brand?.brandName ? <strong className="font-bold">{brand.brandName}</strong> : "your brand"}. Head to your
        dashboard to create vouchers and manage your outlets.
      </p>
      {note && (
        <div className="mx-auto mt-5 flex max-w-md items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3 text-left ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
          <MessageSquareText size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p className="text-[13px] text-gray-700 dark:text-gray-300">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Note from our team</span>
            {note}
          </p>
        </div>
      )}
      <div className="mt-8 flex flex-col items-center gap-3">
        <Button onClick={handleContinue} loading={busy} icon={ArrowRight}>
          Go to my dashboard
        </Button>
        <FormError message={error} />
      </div>
    </section>
  );
}
