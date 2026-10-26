const TONES = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * Small rounded status label ("Verified", "PAN verified", "Recommended").
 * @param {{ tone?: 'success' | 'info' | 'warning' | 'neutral', icon?: import('react').ElementType, children: import('react').ReactNode }} props
 */
export default function StatusPill({ tone = "success", icon: Icon, children }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${TONES[tone]}`}>
      {Icon && <Icon size={12} strokeWidth={3} aria-hidden="true" />}
      {children}
    </span>
  );
}
