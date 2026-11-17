import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Sparkles, TrendingUp, X } from "lucide-react";

const BENEFITS = [
  { icon: Clock, text: "Faster approval — our team can verify your outlet without coming back to you." },
  { icon: TrendingUp, text: "Better visibility — complete listings rank higher and get more views." },
  { icon: Sparkles, text: "More trust — customers like to see the place before they buy a voucher." },
];

/**
 * "Are you sure you want to skip?" for an optional-but-recommended outlet
 * section (Listing Features, Showcase). Skipping is allowed, but the vendor
 * is told plainly that approval can take longer.
 * @param {{ open: boolean, sectionName: string, onAddNow: () => void, onSkip: () => void }} props
 */
export default function SkipConfirmModal({ open, sectionName, onAddNow, onSkip }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onAddNow();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onAddNow]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="skip-confirm-title">
      <button type="button" aria-label="Close" onClick={onAddNow} className="absolute inset-0 h-full w-full cursor-default bg-gray-900/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <button
          type="button"
          onClick={onAddNow}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <div className="px-6 pb-5 pt-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
            <Clock size={22} aria-hidden="true" />
          </span>
          <h2 id="skip-confirm-title" className="mt-4 text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Skip {sectionName} for now?
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600 dark:text-gray-300">
            You can submit without it, but <strong className="font-bold text-amber-700 dark:text-amber-400">your outlet&apos;s approval may be delayed</strong>.
            Our team reviews incomplete listings more carefully and may ask you to add these details first.
          </p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Why it&apos;s worth 2 minutes</p>
          <ul className="mt-2 flex flex-col gap-2">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-gray-700 dark:text-gray-300">
                <Icon size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">You can always add it later from your outlet profile.</p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-gray-700 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-white dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-800"
          >
            Skip anyway
          </button>
          <button
            type="button"
            onClick={onAddNow}
            autoFocus
            className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            Add {sectionName} now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
