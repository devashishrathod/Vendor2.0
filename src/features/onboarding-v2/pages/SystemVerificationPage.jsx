import { useCallback, useMemo } from "react";
import { ArrowRight, Clock, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingPageHeader from "../components/layout/OnboardingPageHeader";
import CheckTiles from "../components/verification/CheckTiles";
import ResultBanner from "../components/verification/ResultBanner";
import { ONBOARDING_ROUTES } from "../config/routes";
import { useSystemVerification } from "../hooks/useSystemVerification";
import { hasCheckIssues } from "../utils/systemVerification";

const CONTINUE_LABEL = { failed: "Continue & fix later", error: "Skip for now" };

/**
 * Last onboarding page, after the brand outlet is submitted: runs the
 * backend system verification, reveals each check as a tile, then shows the
 * result with the real score and continues to the Under review page.
 */
export default function SystemVerificationPage() {
  const navigate = useNavigate();
  const { phase, isRunning, checks, revealed, summary, error, retry } = useSystemVerification();

  const hasIssues = useMemo(() => hasCheckIssues(checks), [checks]);
  const done = Math.max(0, Math.min(revealed, checks.length));
  const goToStatus = useCallback(() => navigate(ONBOARDING_ROUTES.STATUS, { replace: true }), [navigate]);

  return (
    <div className="min-h-dvh bg-app font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <OnboardingPageHeader title="System verification" />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <ResultBanner
          phase={phase}
          isRunning={isRunning}
          done={done}
          total={checks.length}
          hasIssues={hasIssues}
          summary={summary}
          error={error}
        />

        <CheckTiles checks={checks} revealed={revealed} />

        {!isRunning && (
          <div className="mt-6 flex animate-fade-up flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-800"
            >
              <RotateCw size={15} aria-hidden="true" />
              {phase === "error" ? "Try again" : "Run checks again"}
            </button>
            <button
              type="button"
              onClick={goToStatus}
              className="group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {CONTINUE_LABEL[phase] || "Continue"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 px-2 text-center text-[12px] text-gray-500 dark:text-gray-400">
          <Clock size={13} className="shrink-0" aria-hidden="true" />
          Your outlet is saved and submitted — track it any time from the Under review page.
        </p>
      </main>
    </div>
  );
}
