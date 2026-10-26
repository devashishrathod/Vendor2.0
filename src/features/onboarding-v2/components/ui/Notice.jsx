const TONES = {
  neutral: {
    box: "bg-gray-50 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700",
    icon: "text-gray-500",
    text: "text-gray-700 dark:text-gray-300",
  },
  warning: {
    box: "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-800 dark:text-amber-300",
  },
};

/**
 * One-line note under a form ("locked after approval", "please confirm…").
 * @param {{ icon: import('react').ElementType, tone?: 'neutral' | 'warning', children: import('react').ReactNode }} props
 */
export default function Notice({ icon: Icon, tone = "neutral", children }) {
  const styles = TONES[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ring-1 ring-inset ${styles.box}`}>
      <Icon size={16} strokeWidth={2} className={`mt-px shrink-0 ${styles.icon}`} aria-hidden="true" />
      <p className={`text-xs leading-relaxed ${styles.text}`}>{children}</p>
    </div>
  );
}
