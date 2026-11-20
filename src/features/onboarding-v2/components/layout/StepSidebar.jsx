import { ArrowLeft, Check, Eye, Headphones, X } from "lucide-react";
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

// status.profileStrength.level (guide §11): LOW < 50 · MEDIUM 50–74 · STRONG ≥ 75.
const STRENGTH_COLORS = {
  LOW: { bar: "bg-amber-400", text: "text-amber-700 dark:text-amber-400", label: "Low" },
  MEDIUM: { bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-400", label: "Medium" },
  STRONG: { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Strong" },
};

/** One compact "label · value" line with a thin bar under it. */
function ProgressRow({ label, value, percent, barClass, valueClass, ariaLabel }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11.5px]">
        <span className="font-semibold text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-bold ${valueClass}`}>{value}</span>
      </div>
      <div
        className="mt-1 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
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
      {sub.skipped && (
        <span className="rounded-full bg-amber-50 px-1.5 py-px text-[9.5px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
          Skipped
        </span>
      )}
      {sub.isNew && !sub.skipped && (
        <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[9.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
          New
        </span>
      )}
    </li>
  );
}

/**
 * Caption under a step. A skipped screen counts as passed for the group
 * (`state: DONE`), but its own status is SKIPPED — say so instead of "Completed".
 * @param {{ status: string, subs: { label: string, skipped: boolean }[] }} group
 */
function groupCaption(group) {
  if (group.status === "active") return { text: "In progress", tone: "active" };
  if (group.status !== "done") return { text: "Up next", tone: "muted" };
  const skipped = group.subs.filter((s) => s.skipped);
  if (skipped.length > 0 && skipped.length === group.subs.length) return { text: "Skipped", tone: "skipped" };
  if (skipped.length > 0) return { text: `Completed · ${skipped.map((s) => s.label).join(", ")} skipped`, tone: "muted" };
  return { text: "Completed", tone: "muted" };
}

const CAPTION_TONES = {
  active: "font-semibold text-emerald-700 dark:text-emerald-400",
  skipped: "font-semibold text-amber-700 dark:text-amber-400",
  muted: "text-gray-400",
};

/**
 * Brand, progress + profile strength, the 5 steps (sub-steps listed under
 * the active one) and the help box — all from the server's onboarding
 * status. Rendered as the desktop sidebar and inside the mobile drawer.
 * @param {{
 *   groups: ReturnType<typeof import('../../hooks/useOnboardingFlow').useOnboardingFlow>['groups'],
 *   progress: number, stepNumber: number, totalSteps: number,
 *   strength: { score: number, level: string },
 *   canGoBack: boolean, onBack: () => void, onClose?: () => void,
 *   onPreview?: (groupId: string) => void,   - eye icon on each completed main step
 * }} props
 */
export default function StepSidebar({ groups, progress, stepNumber, totalSteps, strength, canGoBack, onBack, onClose, onPreview }) {
  return (
    <div className="thin-scrollbar flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900">
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

      <div className="mx-4 flex flex-col gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <ProgressRow
          label={`Step ${stepNumber} of ${totalSteps}`}
          value={`${progress}%`}
          percent={progress}
          barClass="bg-emerald-500"
          valueClass="text-emerald-700 dark:text-emerald-400"
          ariaLabel="Onboarding progress"
        />
        {strength && (
          <ProgressRow
            label="Profile strength"
            value={`${strength.score} · ${STRENGTH_COLORS[strength.level]?.label ?? strength.level}`}
            percent={strength.score}
            barClass={STRENGTH_COLORS[strength.level]?.bar ?? "bg-gray-400"}
            valueClass={STRENGTH_COLORS[strength.level]?.text ?? "text-gray-600"}
            ariaLabel="Profile strength"
          />
        )}
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
          {groups.map((g) => ({ ...g, caption: groupCaption(g) })).map((group, i) => (
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
                <div className="flex items-start justify-between gap-2">
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
                  {group.status === "done" && onPreview && (
                    <button
                      type="button"
                      onClick={() => onPreview(group.id)}
                      aria-label={`Preview ${group.label}`}
                      title={`Preview ${group.label}`}
                      className="-mr-1 -mt-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                    >
                      <Eye size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className={`mt-0.5 text-[11.5px] ${CAPTION_TONES[group.caption.tone]}`}>{group.caption.text}</p>
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

      <a
        href={`mailto:${HELPDESK_EMAIL}`}
        title={HELPDESK_EMAIL}
        className="group m-4 mt-2 flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-emerald-50 hover:ring-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:bg-gray-800/50 dark:ring-gray-700 dark:hover:bg-emerald-500/10 dark:hover:ring-emerald-500/30"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-emerald-400 dark:ring-gray-700">
          <Headphones size={14} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] font-bold leading-tight text-gray-900 dark:text-gray-100">Need help?</span>
          <span className="block truncate whitespace-nowrap text-[11.5px] font-semibold text-emerald-700 group-hover:text-emerald-800 dark:text-emerald-400">
            {HELPDESK_EMAIL}
          </span>
        </span>
      </a>
    </div>
  );
}
