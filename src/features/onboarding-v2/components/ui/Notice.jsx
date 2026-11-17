import { CircleAlert, Info, TriangleAlert } from "lucide-react";

const TONES = {
  neutral: {
    box: "bg-gray-50 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700",
    icon: "text-gray-500",
    title: "text-gray-900 dark:text-gray-100",
    text: "text-gray-700 dark:text-gray-300",
    fallbackIcon: Info,
  },
  info: {
    box: "bg-sky-50 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30",
    icon: "text-sky-700 dark:text-sky-400",
    title: "text-sky-900 dark:text-sky-200",
    text: "text-sky-800 dark:text-sky-300",
    fallbackIcon: Info,
  },
  warning: {
    box: "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-200",
    text: "text-amber-800 dark:text-amber-300",
    fallbackIcon: TriangleAlert,
  },
  error: {
    box: "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/30",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-800 dark:text-red-200",
    text: "text-red-700 dark:text-red-300",
    fallbackIcon: CircleAlert,
  },
};

/**
 * Short note inside a step ("locked after approval", "please confirm…",
 * an API error). `title` adds a bold first line (blue info panels).
 * Error notices are announced to screen readers.
 * @param {{
 *   icon?: import('react').ElementType,
 *   tone?: 'neutral' | 'info' | 'warning' | 'error',
 *   title?: string,
 *   action?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function Notice({ icon, tone = "neutral", title, action, children }) {
  const styles = TONES[tone] ?? TONES.neutral;
  const Icon = icon ?? styles.fallbackIcon;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ring-1 ring-inset ${styles.box}`}
    >
      <Icon size={16} strokeWidth={2} className={`mt-px shrink-0 ${styles.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className={`text-[13px] font-bold ${styles.title}`}>{title}</p>}
        <div className={`text-xs leading-relaxed ${title ? "mt-0.5" : ""} ${styles.text}`}>{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
