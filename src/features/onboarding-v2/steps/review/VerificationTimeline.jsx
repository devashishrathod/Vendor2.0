import { History } from "lucide-react";
import { timelineEntries } from "./reviewHelpers";

/**
 * Review history from GET /brands/verifications/history (API doc #33),
 * newest first — each event is its own row; a rejection shows its reason.
 * @param {{ rows: object[], title?: string }} props
 */
export default function VerificationTimeline({ rows = [], title = "Review history" }) {
  const entries = timelineEntries(rows);
  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-gray-200 sm:p-5 dark:bg-gray-900 dark:ring-gray-800" aria-label={title}>
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-gray-100">
        <History size={16} className="text-gray-500" aria-hidden="true" />
        {title}
      </h2>
      <ol className="mt-3 flex flex-col">
        {entries.map((entry, index) => (
          <li key={entry.id ?? index} className="relative flex gap-3 pb-3 last:pb-0">
            {index < entries.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />}
            <span className={`mt-1 size-[11px] shrink-0 rounded-full ${index === 0 ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                {entry.label}
                {entry.attempt ? <span className="font-medium text-gray-500"> · attempt {entry.attempt}</span> : null}
              </p>
              {entry.when && <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{entry.when}</p>}
              {entry.note && <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">“{entry.note}”</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
