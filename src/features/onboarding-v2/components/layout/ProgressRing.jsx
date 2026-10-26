const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Small circular progress indicator for the header. @param {{ value: number, size?: number }} props */
export default function ProgressRing({ value, size = 22 }) {
  const filled = (Math.min(100, Math.max(0, value)) / 100) * CIRCUMFERENCE;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="5" className="stroke-emerald-100 dark:stroke-emerald-500/20" />
      <circle
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        transform="rotate(-90 18 18)"
        className="stroke-emerald-500 transition-[stroke-dasharray] duration-500"
      />
    </svg>
  );
}
