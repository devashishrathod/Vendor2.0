import { Fragment } from "react";
import { Check } from "lucide-react";

// Review & submit is its own page after these two, not a step here.
const STEPS = ["Brand details", "Outlet details"];

/**
 * "① Brand details — ② Outlet details". Done steps are
 * clickable to jump back. Labels of inactive steps hide on phones.
 * @param {{ currentStep: number, onSelect?: (step: number) => void }} props - 1-based
 */
export default function OutletStepper({ currentStep, onSelect }) {
  return (
    <ol className="flex w-max items-center gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        const clickable = done && onSelect;
        const Tag = clickable ? "button" : "span";
        return (
          <Fragment key={label}>
            {i > 0 && (
              <span
                className={`h-0.5 w-5 rounded-full sm:w-6 ${done || active ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
                aria-hidden="true"
              />
            )}
            <li>
              <Tag
                {...(clickable ? { type: "button", onClick: () => onSelect(step) } : {})}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full py-1 text-[13px] font-bold ${
                  active ? "bg-emerald-50 pl-1 pr-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : ""
                } ${done ? "text-emerald-700 dark:text-emerald-400" : ""} ${
                  !done && !active ? "text-gray-500 dark:text-gray-400" : ""
                } ${clickable ? "cursor-pointer hover:underline" : ""}`}
              >
                <span
                  className={`grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] ${
                    active
                      ? "bg-emerald-500 text-white"
                      : done
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20"
                        : "ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : step}
                </span>
                <span className={active ? "" : "hidden md:inline"}>{label}</span>
              </Tag>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
