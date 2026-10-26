import { Check, X } from "lucide-react";

/**
 * Live requirement list ("PAN requirements", "Checks", …). Rules stay
 * neutral grey until `active` (the vendor has typed something), then show
 * met / not met.
 * @param {{ title: string, rules: { label: string, passed: boolean }[], active?: boolean }} props
 */
export default function RuleChecklist({ title, rules, active = false }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
      <ul className="mt-2.5 flex flex-col gap-2.5">
        {rules.map((rule) => {
          const state = !active ? "idle" : rule.passed ? "passed" : "failed";
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-2 text-xs ${
                state === "passed" ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full ${
                  state === "passed"
                    ? "bg-emerald-500 text-white"
                    : state === "failed"
                      ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
                aria-hidden="true"
              >
                {state === "passed" && <Check size={10} strokeWidth={3.5} />}
                {state === "failed" && <X size={10} strokeWidth={3.5} />}
              </span>
              {rule.label}
              {state !== "idle" && <span className="sr-only">{state === "passed" ? "(met)" : "(not met)"}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
