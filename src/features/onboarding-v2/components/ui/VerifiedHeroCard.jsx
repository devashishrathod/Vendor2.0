import { ShieldCheck } from "lucide-react";

/**
 * Dark green summary card at the top of a review screen (PAN, GSTIN or
 * bank account). `aside` adds a right-hand label/value (account holder);
 * without it a shield badge sits there.
 * @param {{
 *   label: string,
 *   value: string,
 *   icon?: import('react').ElementType,
 *   aside?: { label: string, value: string },
 * }} props
 */
export default function VerifiedHeroCard({ label, value, icon: Icon, aside }) {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-emerald-900 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:18px_18px] p-5 shadow-[0_16px_32px_-18px_rgba(6,78,59,0.55)] sm:flex-row sm:items-center sm:justify-between sm:px-[26px] sm:py-6">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 text-emerald-300 ring-1 ring-inset ring-white/20">
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">{label}</p>
          <p className="mt-1 break-all text-lg font-extrabold tracking-[0.12em] text-white sm:text-[22px]">{value}</p>
        </div>
      </div>
      {aside ? (
        <div className="sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">{aside.label}</p>
          <p className="mt-1 text-sm font-extrabold text-white">{aside.value}</p>
        </div>
      ) : (
        <span className="hidden size-[42px] shrink-0 place-items-center rounded-xl bg-white/12 text-emerald-300 ring-1 ring-inset ring-white/20 sm:grid">
          <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
