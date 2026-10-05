import { useState } from "react";

// Collapsible wrapper for optional/advanced field groups — same
// open/close interaction as the AccordionFieldCard already used on the
// Under Review page (Youroutlet.jsx, PAN/GST/Bank rows), but sized for a
// whole section (Listing Features + Showcase Collection) rather than a
// single field row. Kept as its own copy here instead of importing from
// Youroutlet.jsx, since that page is unrelated and out of scope to touch.
export default function AccordionFieldCard({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  collapseSignal,
  openSignal,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Tracked so a change in either signal can be detected and applied
  // during render (see below) instead of via a setState-in-effect, which
  // trips this codebase's react-hooks/set-state-in-effect rule.
  const [prevCollapseSignal, setPrevCollapseSignal] = useState(collapseSignal);
  const [prevOpenSignal, setPrevOpenSignal] = useState(openSignal);

  if (collapseSignal !== prevCollapseSignal) {
    setPrevCollapseSignal(collapseSignal);
    if (collapseSignal) setOpen(false);
  }

  // Bumped by a parent to force this open on demand (e.g. jumping here
  // from a warning elsewhere on the page).
  if (openSignal !== prevOpenSignal) {
    setPrevOpenSignal(openSignal);
    if (openSignal) setOpen(true);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6 pt-1">{children}</div>}
    </div>
  );
}
