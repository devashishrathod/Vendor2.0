import { ArrowLeft, Check, Headphones, X } from "lucide-react";
import { HELPDESK_EMAIL } from "../../constants/onboardingOptions";

function GroupMarker({ status, number }) {
  if (status === "done") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${
        status === "active"
          ? "bg-white font-extrabold text-emerald-700 ring-2 ring-inset ring-emerald-500 shadow-[0_0_0_4px_#D1FAE5] dark:bg-gray-900 dark:text-emerald-400 dark:shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
          : "bg-gray-100 font-bold text-gray-400 dark:bg-gray-800 dark:text-gray-500"
      }`}
    >
      {number}
    </span>
  );
}

function SubStep({ sub }) {
  return (
    <li
      aria-current={sub.state === "current" ? "step" : undefined}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${
        sub.state === "current"
          ? "bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : sub.state === "done"
            ? "font-medium text-gray-600 dark:text-gray-400"
            : "font-medium text-gray-400 dark:text-gray-500"
      }`}
    >
      {sub.state === "done" && !sub.skipped ? (
        <Check size={13} strokeWidth={3} className="shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <span
          className={`mx-[3.5px] size-1.5 shrink-0 rounded-full ${sub.state === "current" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
          aria-hidden="true"
        />
      )}
      <span className="flex-1">{sub.label}</span>
      {sub.skipped && <span className="text-[10px] font-semibold text-gray-400">Skipped</span>}
      {sub.isNew && !sub.skipped && (
        <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[9.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
          New
        </span>
      )}
    </li>
  );
}

/**
 * Brand, progress, the 4 steps (sub-steps listed under the active one) and
 * the help box. Rendered as the desktop sidebar and inside the mobile drawer.
 * @param {{
 *   groups: ReturnType<typeof import('../../hooks/useOnboardingFlow').useOnboardingFlow>['groups'],
 *   progress: number, stepNumber: number, totalSteps: number,
 *   canGoBack: boolean, onBack: () => void, onClose?: () => void,
 * }} props
 */
export default function StepSidebar({ groups, progress, stepNumber, totalSteps, canGoBack, onBack, onClose }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2.5 px-5 pb-[18px] pt-[22px]">
        <span className="grid size-[34px] place-items-center rounded-[10px] bg-emerald-600 text-[17px] font-extrabold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]">
          T
        </span>
        <div className="flex-1">
          <p className="text-[17px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50">Trydood</p>
          <p className="text-[11px] font-medium text-gray-500">Vendor Panel</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close steps"
            className="grid size-10 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mx-4 rounded-[14px] bg-emerald-50/60 p-3.5 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/5 dark:ring-emerald-500/20">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Your progress</span>
          <span className="text-[13px] font-extrabold text-emerald-700 dark:text-emerald-400">{progress}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11.5px] text-gray-500">
          Step {stepNumber} of {totalSteps} · progress is saved
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="ml-4 mt-3 inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg px-1 text-[13px] font-semibold text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Back
      </button>

      <nav aria-label="Onboarding steps" className="flex-1 px-5 pt-3">
        <ol>
          {groups.map((group, i) => (
            <li key={group.id} className="flex gap-3" aria-current={group.status === "active" ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <GroupMarker status={group.status} number={group.number} />
                {i < groups.length - 1 && (
                  <span
                    className={`my-1 min-h-[18px] w-0.5 flex-1 rounded-full ${group.status === "done" ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-[18px] pt-1">
                <p
                  className={`text-[13.5px] leading-tight ${
                    group.status === "active"
                      ? "font-bold text-gray-900 dark:text-gray-50"
                      : group.status === "done"
                        ? "font-semibold text-gray-700 dark:text-gray-300"
                        : "font-semibold text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {group.label}
                </p>
                <p className={`mt-0.5 text-[11.5px] ${group.status === "active" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-gray-400"}`}>
                  {group.status === "done" ? "Completed" : group.status === "active" ? "In progress" : "Up next"}
                </p>
                {group.status === "active" && group.subs.length > 0 && (
                  <ul className="mt-2.5 flex flex-col gap-0.5">
                    {group.subs.map((sub) => (
                      <SubStep key={sub.label} sub={sub} />
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <div className="m-4 mt-2 flex gap-2.5 rounded-[14px] bg-gray-50 p-3.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700">
          <Headphones size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100">Need help?</p>
          <a href={`mailto:${HELPDESK_EMAIL}`} className="break-all text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            {HELPDESK_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
