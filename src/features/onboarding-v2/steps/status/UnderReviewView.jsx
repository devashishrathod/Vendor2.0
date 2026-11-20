import { useCallback, useEffect, useState } from "react";
import { Check, ChevronRight, FilePlus2, Hourglass, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileStrengthCard from "../../components/strength/ProfileStrengthCard";
import { isWizardScreen } from "../../config/routes";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { getVerificationHistory } from "../../services/onboardingApi";
import SystemChecksCard from "../review/SystemChecksCard";
import VerificationTimeline from "../review/VerificationTimeline";
import { STRENGTH_ITEM_SCREENS, reviewAction } from "../review/reviewHelpers";

const NEW_VOUCHER_ROUTE = "/vouchers/new";

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

/**
 * Submitted → System verification → Admin review → Approved (guide §7.1).
 * After a resubmit the time comes from the newest RESUBMITTED history row —
 * `verification.submittedAt` still carries the first attempt's time.
 */
function Stages({ verification, checks, history }) {
  const passed = checks.filter((c) => c.passed).length;
  const resubmitted = verification.attemptNumber > 1;
  const resubmittedAt = resubmitted ? history.find((row) => row.action === "RESUBMITTED")?.createdAt : null;
  const stages = [
    {
      label: resubmitted ? "Resubmitted" : "Submitted",
      detail: formatDate(resubmittedAt || verification.submittedAt),
      state: "done",
    },
    { label: "System verification", detail: checks.length ? `${passed} of ${checks.length} checks passed` : "Done", state: "done" },
    { label: "Review by our team", detail: "In progress", state: "current" },
    { label: "Approved", detail: null, state: "upcoming" },
  ];
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className={`flex items-start gap-2.5 rounded-xl p-3 ring-1 ring-inset ${
            stage.state === "current"
              ? "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
              : "bg-gray-50 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700"
          }`}
          aria-current={stage.state === "current" ? "step" : undefined}
        >
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
              stage.state === "done"
                ? "bg-emerald-500 text-white"
                : stage.state === "current"
                  ? "bg-amber-400 text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
            }`}
            aria-hidden="true"
          >
            {stage.state === "done" ? <Check size={13} strokeWidth={3.5} /> : stage.state === "current" ? <Hourglass size={12} /> : index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-gray-900 dark:text-gray-100">{stage.label}</span>
            {stage.detail && <span className="block text-[11.5px] text-gray-500 dark:text-gray-400">{stage.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * UNDER_REVIEW — "Your profile is under review" (guide §7.1): the review
 * stages, what the vendor can do meanwhile (strength items with points and
 * a first voucher draft), the system checks and the history. Add-only: an
 * item opens its screen to add what's missing; anything already given is
 * locked (409 ONBOARDING_LOCKED) until a decision.
 */
export default function UnderReviewView() {
  const { status, openScreen } = useOnboardingFlow();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getVerificationHistory()
      .then(setHistory)
      .catch((err) => console.error("Verification history fetch failed:", err));
  }, []);

  const canOpen = useCallback((screen) => reviewAction(screen, status) !== "locked" && isWizardScreen(screen), [status]);
  const selectableKeys = Object.entries(STRENGTH_ITEM_SCREENS)
    .filter(([, screen]) => canOpen(screen))
    .map(([key]) => key);

  const verification = status?.verification ?? {};
  const checks = status?.systemChecks ?? [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="flex flex-col gap-6 p-5 sm:p-8">
        <header className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-200 sm:size-[52px] sm:rounded-[14px] dark:bg-amber-500/10 dark:ring-amber-500/30">
            <Hourglass size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px] dark:text-gray-50">Your profile is under review</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Our team is checking your details. We&apos;ll let you know as soon as there&apos;s a decision.</p>
          </div>
        </header>

        <Stages verification={verification} checks={checks} history={history} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">Meanwhile you can</h2>
            <ProfileStrengthCard
              strength={status?.profileStrength}
              isVerified={status?.isVerified}
              title="Strengthen your profile"
              selectableKeys={selectableKeys}
              onSelectItem={(key) => openScreen(STRENGTH_ITEM_SCREENS[key])}
            />
            <Link
              to={NEW_VOUCHER_ROUTE}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 transition hover:bg-emerald-50 hover:ring-emerald-200 dark:bg-gray-900 dark:ring-gray-800 dark:hover:bg-emerald-500/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FilePlus2 size={17} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-gray-900 dark:text-gray-100">Draft your first voucher</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">It goes live once your brand is approved.</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
            </Link>
            <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Lock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              While we review, you can add what&apos;s missing. Details you&apos;ve already given stay as they are until our decision.
            </p>
          </div>

          <aside className="flex flex-col gap-4">
            <SystemChecksCard checks={checks} onFix={openScreen} canFix={canOpen} title="System checks on your application" />
            <VerificationTimeline rows={history} />
          </aside>
        </div>
      </div>
    </section>
  );
}
