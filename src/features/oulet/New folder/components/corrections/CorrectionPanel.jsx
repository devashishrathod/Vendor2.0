import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Collapsible card used by the rejected-brand corrections (same look as the
 * Under Review page's other cards). `saved` shows a green tick in the header.
 * @param {{
 *   title: string, summary?: string, saved?: boolean, defaultOpen?: boolean,
 *   nested?: boolean, children: import('react').ReactNode,
 * }} props
 */
export default function CorrectionPanel({ title, summary, saved = false, defaultOpen = false, nested = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const frame = nested
    ? "rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
    : "rounded-3xl border border-white/80 bg-white/70 shadow-[0_8px_30px_rgba(16,185,129,0.07)] backdrop-blur-xl dark:border-white/5 dark:bg-gray-900/60";

  return (
    <div className={frame}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 font-semibold text-gray-800 dark:text-gray-200 ${nested ? "text-[13px]" : "text-sm"}`}>{title}</span>
          {saved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check size={11} strokeWidth={3} aria-hidden="true" />
              Saved
            </span>
          ) : (
            summary && <span className="truncate text-xs text-gray-400">{summary}</span>
          )}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}
