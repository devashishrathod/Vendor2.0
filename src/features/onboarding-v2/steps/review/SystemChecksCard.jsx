import { Check, ChevronRight, Minus, ShieldCheck, X } from "lucide-react";
import { SYSTEM_CHECKS } from "./reviewHelpers";

const STATE = {
  passed: { icon: Check, chip: "bg-emerald-500 text-white", text: "Passed" },
  failed: { icon: X, chip: "bg-red-500 text-white", text: "Didn't pass" },
  skipped: { icon: Minus, chip: "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-100", text: "Skipped" },
};

/**
 * "When you submit we run system verification automatically" (guide §6):
 * `status.systemChecks` — pass / didn't pass / skipped, each failed or
 * skipped one with a link to the section that fixes it. Live before submit
 * (no paid call). No total score or verdict — that's for our team.
 * @param {{
 *   checks: import('../../types').SystemCheck[],
 *   onFix?: (screen: string) => void,
 *   canFix?: (screen: string) => boolean,
 *   title?: string,
 * }} props
 */
export default function SystemChecksCard({ checks = [], onFix, canFix = () => false, title = "When you submit, we run these checks automatically" }) {
  if (checks.length === 0) return null;
  const anyOpen = checks.some((c) => !c.passed);

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 sm:p-5 dark:bg-gray-900 dark:ring-gray-800" aria-label="System checks">
      <h2 className="flex items-start gap-2 text-sm font-extrabold text-gray-900 dark:text-gray-100">
        <ShieldCheck size={17} className="mt-px shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-1.5">
        {checks.map((check) => {
          const info = SYSTEM_CHECKS[check.key] ?? { label: check.key };
          const state = check.passed ? STATE.passed : check.skipped ? STATE.skipped : STATE.failed;
          const Icon = state.icon;
          const fixable = !check.passed && info.screen && onFix && canFix(info.screen);
          return (
            <li key={check.key} className="flex min-h-9 items-center gap-2.5">
              <span className={`grid size-5 shrink-0 place-items-center rounded-full ${state.chip}`} aria-hidden="true">
                <Icon size={11} strokeWidth={3.5} />
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-gray-800 dark:text-gray-200">
                {info.label}
                <span className="sr-only"> — {state.text}</span>
              </span>
              {fixable ? (
                <button
                  type="button"
                  onClick={() => onFix(info.screen)}
                  className="inline-flex min-h-8 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  {check.skipped ? "Add" : "Fix"} <span className="font-extrabold">+{check.points}</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </button>
              ) : (
                !check.passed && <span className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-gray-400">{state.text}</span>
              )}
            </li>
          );
        })}
      </ul>
      {anyOpen && (
        <p className="mt-3 text-[11.5px] leading-relaxed text-gray-500 dark:text-gray-400">
          A check that doesn&apos;t pass won&apos;t stop your submission — our team may just take a little longer to review.
        </p>
      )}
    </section>
  );
}
