/**
 * Three bouncing bars shown next to whatever is playing.
 * @param {{ className?: string }} props  bar colour, e.g. "bg-emerald-600"
 */
export default function EqualizerBars({ className = "bg-emerald-600" }) {
  return (
    <span aria-hidden="true" className="inline-flex h-3 items-end gap-0.5">
      <span className={`block h-3 w-[3px] origin-bottom animate-eq rounded-sm ${className}`} />
      <span className={`block h-3 w-[3px] origin-bottom animate-eq rounded-sm [animation-delay:150ms] ${className}`} />
      <span className={`block h-3 w-[3px] origin-bottom animate-eq rounded-sm [animation-delay:300ms] ${className}`} />
    </span>
  );
}
