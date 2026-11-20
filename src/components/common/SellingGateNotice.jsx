import { Link } from "react-router-dom";
import { ArrowRight, Lock, X } from "lucide-react";

/**
 * What the selling gate needs (from sellingGateFor), with its one CTA.
 * @param {{ gate: { title: string, message: string, cta: { label: string, to: string } }, onDismiss?: () => void }} props
 */
export default function SellingGateNotice({ gate, onDismiss }) {
  if (!gate) return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200 sm:flex-row sm:items-center dark:bg-amber-500/10 dark:ring-amber-500/30" role="alert">
      <Lock size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{gate.title}</p>
        <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">{gate.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={gate.cta.to}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700"
        >
          {gate.cta.label}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid size-10 place-items-center rounded-xl text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
