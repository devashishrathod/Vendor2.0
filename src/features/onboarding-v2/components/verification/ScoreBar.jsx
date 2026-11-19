import { SCORE_MARKS } from "./verificationTheme";

/**
 * Verification score out of 100 in a compact panel: number, a gradient bar
 * that grows in, ticks at the review / auto-approve marks and a legend.
 * @param {{ score: number, barClass: string, scoreClass: string, className?: string }} props
 */
export default function ScoreBar({ score, barClass, scoreClass, className = "" }) {
  return (
    <div className={`animate-fade-up rounded-xl bg-gray-50/80 px-3.5 py-3 ring-1 ring-inset ring-gray-100 dark:bg-gray-800/50 dark:ring-gray-700/60 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Verification score</p>
        <p className="shrink-0 leading-none">
          <span className={`text-2xl font-extrabold tabular-nums tracking-tight ${scoreClass}`}>{score}</span>
          <span className="ml-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">/100</span>
        </p>
      </div>

      <div
        className="relative mt-2"
        role="meter"
        aria-label="Verification score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <div className="h-2 overflow-hidden rounded-full bg-gray-200/70 dark:bg-gray-700/70">
          <div className={`h-full origin-left animate-bar-grow rounded-full ${barClass}`} style={{ width: `${Math.max(score, 2)}%` }} />
        </div>
        {SCORE_MARKS.map((mark) => (
          <span
            key={mark.value}
            className="absolute -top-0.5 h-3 w-[3px] -translate-x-1/2 rounded-full bg-white ring-1 ring-gray-300 dark:bg-gray-900 dark:ring-gray-600"
            style={{ left: `${mark.value}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {SCORE_MARKS.map((mark) => (
          <li key={mark.value} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className={`size-1.5 rounded-full ${mark.dot}`} aria-hidden="true" />
            {mark.value}+ {mark.label.toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
