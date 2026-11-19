import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

// Updates shown before "Show earlier updates" — the newest ones.
const VISIBLE_COUNT = 3;

const NEUTRAL_CHIP = "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300";

/**
 * @typedef {Object} TimelineItem
 * @property {string} id
 * @property {string} dotColor
 * @property {string} ringColor
 * @property {string} [title]            - plain row (e.g. "Submitted for review")
 * @property {string} [actionLabel]
 * @property {string} [statusLabel]
 * @property {string} [badgeClass]
 * @property {number} [attemptNumber]
 * @property {string} [performedByType]
 * @property {string|null} [transition]
 * @property {string[]} [reasons]
 * @property {string} date
 */

/** "Attempt 2 · By System · Pending → Action needed" on one line. */
function metaLine(item, formatActor) {
  return [
    item.attemptNumber && `Attempt ${item.attemptNumber}`,
    item.performedByType && `By ${formatActor(item.performedByType)}`,
    item.transition,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ReasonChips({ reasons, chipClass }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {reasons.map((reason, i) => (
        <li key={`${reason}-${i}`} className={`rounded-md px-2 py-0.5 text-[11.5px] font-medium ${chipClass}`}>
          {reason}
        </li>
      ))}
    </ul>
  );
}

/**
 * Status History, kept short: the newest update shows its reasons, older
 * ones collapse to one line with an "N issues" toggle, reasons are compact
 * chips instead of a bullet list, and only the last few updates show until
 * "Show earlier updates" is pressed.
 * @param {{ items: TimelineItem[], loading?: boolean, formatActor: (value: string) => string }} props
 */
export default function StatusHistoryTimeline({ items, loading = false, formatActor }) {
  const [showAll, setShowAll] = useState(false);
  const [openIds, setOpenIds] = useState(() => new Set());

  // The newest update with reasons is what the vendor has to act on — always open.
  const latestWithReasonsId = useMemo(() => [...items].reverse().find((item) => item.reasons?.length)?.id ?? null, [items]);

  const hiddenCount = showAll ? 0 : Math.max(0, items.length - VISIBLE_COUNT);
  const visible = items.slice(hiddenCount);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const nextIds = new Set(prev);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });

  return (
    <div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mb-2 ml-6 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
        >
          Show {hiddenCount} earlier update{hiddenCount === 1 ? "" : "s"}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      <div className="relative">
        <div className="absolute bottom-2 left-[5px] top-2 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
        <ol className="space-y-2">
          {visible.map((item) => {
            const reasons = item.reasons ?? [];
            const isLatest = item.id === latestWithReasonsId;
            const isOpen = isLatest || openIds.has(item.id);
            const meta = metaLine(item, formatActor);

            return (
              <li key={item.id} className="relative flex items-start gap-3">
                <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${item.dotColor} ${item.ringColor}`} />
                <div className="min-w-0 flex-1 rounded-xl bg-white/70 px-3 py-2 dark:bg-gray-800/60">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.title || item.actionLabel}</span>
                      {!item.title && item.statusLabel && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.badgeClass}`}>
                          {item.statusLabel}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">{item.date}</span>
                  </div>

                  {meta && <p className="mt-0.5 text-[11px] text-gray-400">{meta}</p>}

                  {reasons.length > 0 && isOpen && (
                    <ReasonChips reasons={reasons} chipClass={isLatest ? item.badgeClass || NEUTRAL_CHIP : NEUTRAL_CHIP} />
                  )}

                  {reasons.length > 0 && !isLatest && (
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-expanded={isOpen}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {isOpen ? "Hide issues" : `${reasons.length} issue${reasons.length === 1 ? "" : "s"}`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}

          {loading && (
            <li className="relative flex items-start gap-3">
              <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 ring-4 ring-amber-100" />
              <p className="text-sm text-gray-500">Checking current status…</p>
            </li>
          )}
        </ol>
      </div>

      {showAll && items.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="ml-6 mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Show fewer
          <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
