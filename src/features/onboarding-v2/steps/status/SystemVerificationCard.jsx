import { useEffect, useState } from "react";
import { Check, ChevronRight, LoaderCircle, Minus, ShieldCheck, TriangleAlert } from "lucide-react";
import { SYSTEM_CHECKS } from "../review/reviewHelpers";

// The checks are already done when the vendor gets here — on open they are
// played back one by one (first after FIRST_DELAY_MS, then every STEP_MS) so
// the vendor sees what was checked. Reduced motion shows the results at once.
const FIRST_DELAY_MS = 500;
const STEP_MS = 450;

const RING_RADIUS = 27;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const RESULT = {
  passed: {
    icon: Check,
    chip: "bg-emerald-500 text-white",
    row: "",
    text: "Passed",
    textClass: "text-emerald-700 dark:text-emerald-400",
  },
  failed: {
    icon: TriangleAlert,
    chip: "bg-amber-400 text-white",
    row: "bg-amber-50/70 dark:bg-amber-500/10",
    text: "Needs attention",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  skipped: {
    icon: Minus,
    chip: "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-100",
    row: "",
    text: "Skipped",
    textClass: "text-gray-500 dark:text-gray-400",
  },
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** @param {import('../../types').SystemCheck} check */
const resultOf = (check) => (check.passed ? RESULT.passed : check.skipped ? RESULT.skipped : RESULT.failed);

/** Passed-checks ring: fills as results come in. */
function ProgressRing({ passed, total }) {
  const share = total ? passed / total : 0;
  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={RING_RADIUS} fill="none" strokeWidth="6" className="stroke-gray-100 dark:stroke-gray-800" />
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - share)}
          className="stroke-emerald-500 transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-base font-extrabold tabular-nums text-gray-900 dark:text-gray-100">
          {passed}
          <span className="text-xs font-bold text-gray-400">/{total}</span>
        </span>
      </span>
    </div>
  );
}

/**
 * UNDER_REVIEW — the system verification that ran on submit
 * (`status.systemChecks`), shown as an animated checklist: each check moves
 * from "Checking…" to its result, a ring counts the passed ones. A check
 * that didn't pass / was skipped keeps its "Fix / Add +N" link when that
 * screen can still be opened (add-only while under review).
 * @param {{
 *   checks: import('../../types').SystemCheck[],
 *   onFix?: (screen: string) => void,
 *   canFix?: (screen: string) => boolean,
 * }} props
 */
export default function SystemVerificationCard({ checks = [], onFix, canFix = () => false }) {
  const total = checks.length;
  const [revealed, setRevealed] = useState(() => (prefersReducedMotion() ? Number.MAX_SAFE_INTEGER : 0));

  useEffect(() => {
    if (revealed >= total) return undefined;
    const timer = setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? FIRST_DELAY_MS : STEP_MS);
    return () => clearTimeout(timer);
  }, [revealed, total]);

  if (total === 0) return null;

  const shown = Math.min(revealed, total);
  const running = shown < total;
  const passedSoFar = checks.slice(0, shown).filter((c) => c.passed).length;
  const failedCount = checks.filter((c) => !c.passed && !c.skipped).length;
  const skippedCount = checks.filter((c) => !c.passed && c.skipped).length;
  const allPassed = failedCount === 0 && skippedCount === 0;

  let summary;
  if (running) summary = "Going through your details…";
  else if (allPassed) summary = "Everything checks out.";
  else summary = `${failedCount + skippedCount} ${failedCount + skippedCount === 1 ? "check needs" : "checks need"} a look.`;

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 sm:p-5 dark:bg-gray-900 dark:ring-gray-800" aria-labelledby="system-verification-title">
      <header className="flex items-center gap-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
          {running && <span className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/60 motion-safe:animate-ping" aria-hidden="true" />}
          <ShieldCheck size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="system-verification-title" className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
            System verification
          </h2>
          <p className="text-[11.5px] text-gray-500 dark:text-gray-400">Automatic checks on your application</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset transition-colors ${
            running
              ? "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
          }`}
        >
          {running ? (
            <span className="size-1.5 rounded-full bg-sky-500 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <Check size={11} strokeWidth={3.5} aria-hidden="true" />
          )}
          {running ? "Checking" : "Done"}
        </span>
      </header>

      <div className="mt-4 flex items-center gap-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
        <ProgressRing passed={passedSoFar} total={total} />
        <div className="min-w-0" aria-live="polite">
          <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
            {passedSoFar} of {total} passed
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{summary}</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {checks.map((check, index) => {
          const info = SYSTEM_CHECKS[check.key] ?? { label: check.key };
          const isDone = index < shown;
          const isChecking = index === shown;
          const result = resultOf(check);
          const Icon = result.icon;
          const fixable = isDone && !check.passed && info.screen && onFix && canFix(info.screen);

          return (
            <li
              key={check.key}
              className={`relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2 transition-colors duration-300 ${
                isDone ? result.row : isChecking ? "bg-sky-50/70 dark:bg-sky-500/10" : ""
              }`}
            >
              {isChecking && (
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-shimmer dark:via-white/10"
                  aria-hidden="true"
                />
              )}

              {isDone ? (
                <span className={`grid size-6 shrink-0 place-items-center rounded-full animate-check-pop ${result.chip}`} aria-hidden="true">
                  <Icon size={12} strokeWidth={3} />
                </span>
              ) : isChecking ? (
                <span className="grid size-6 shrink-0 place-items-center text-sky-500" aria-hidden="true">
                  <LoaderCircle size={18} className="motion-safe:animate-spin" />
                </span>
              ) : (
                <span className="grid size-6 shrink-0 place-items-center" aria-hidden="true">
                  <span className="size-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                </span>
              )}

              <span className={`relative min-w-0 flex-1 transition-opacity duration-300 ${isDone || isChecking ? "opacity-100" : "opacity-50"}`}>
                <span className="block text-[13px] font-semibold text-gray-800 dark:text-gray-200">{info.label}</span>
                <span
                  className={`block text-[11px] font-medium ${
                    isDone ? result.textClass : isChecking ? "text-sky-600 dark:text-sky-400" : "text-gray-400"
                  }`}
                >
                  {isDone ? result.text : isChecking ? "Checking…" : "Waiting"}
                </span>
              </span>

              {fixable && (
                <button
                  type="button"
                  onClick={() => onFix(info.screen)}
                  className="relative inline-flex min-h-8 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-bold text-emerald-700 animate-fade-in hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  {check.skipped ? "Add" : "Fix"} <span className="font-extrabold">+{check.points}</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!running && !allPassed && (
        <p className="mt-3 animate-fade-in text-[11.5px] leading-relaxed text-gray-500 dark:text-gray-400">
          A check that didn&apos;t pass doesn&apos;t stop the review — our team may just take a little longer.
        </p>
      )}
    </section>
  );
}
