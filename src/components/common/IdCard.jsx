import { ShieldCheck } from "lucide-react";

// Shared light physical-card shell (gradient, soft rings, big faded
// watermark). Each card (GST, PAN, subscription plan) passes its own
// colors + watermark so they read as different cards with the same family
// look. In dark mode each card uses a gray-700 base (same as the bento
// tiles beside it) with only a soft accent glow toward one corner — a
// fully tinted *-950 base read as muddy brown/green on gray-800.
// `verified` shows the green shield badge in the header.
export function IdCardShell({ gradient, ring, watermark, heading, subheading, accent, verified, children }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl p-5 shadow-sm ring-1 sm:p-6 ${gradient} ${ring}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[10px] border-white/50 dark:border-white/5" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full border-[10px] border-white/40 dark:border-white/5" />
      <span
        className={`pointer-events-none absolute -bottom-4 right-3 select-none text-8xl font-black tracking-tighter opacity-[0.07] dark:opacity-[0.04] ${accent}`}
      >
        {watermark}
      </span>

      <div className="relative flex items-center justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className={`h-8 w-1 rounded-full bg-current ${accent}`} />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-900 dark:text-gray-100">
              {heading}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {subheading}
            </p>
          </div>
        </div>
        {verified && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-emerald-300 dark:bg-gray-900/40">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

export function CardLabel({ children }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">{children}</p>
  );
}

export function Chip() {
  return (
    <div className="mt-1 h-9 w-12 flex-shrink-0 rounded-md bg-gradient-to-br from-amber-100 via-amber-300 to-amber-400 shadow-inner ring-1 ring-amber-500/40">
      <div className="mx-auto mt-2 grid h-5 w-8 grid-cols-3 gap-px rounded-sm border border-amber-600/30">
        <span className="border-r border-amber-600/25" />
        <span className="border-r border-amber-600/25" />
        <span />
      </div>
    </div>
  );
}

