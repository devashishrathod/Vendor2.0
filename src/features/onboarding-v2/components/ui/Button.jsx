import { LoaderCircle } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none dark:disabled:bg-gray-800 dark:disabled:text-gray-500",
  secondary:
    "bg-white text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:text-gray-400 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800",
  ghost:
    "text-gray-700 hover:bg-gray-100 disabled:text-gray-400 dark:text-gray-300 dark:hover:bg-gray-800",
};

/**
 * Onboarding button — 44px min height for touch.
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'ghost',
 *   icon?: import('react').ElementType,
 *   iconPosition?: 'start' | 'end',
 *   loading?: boolean,
 * } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = "primary",
  icon: Icon,
  iconPosition = "end",
  loading = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...props
}) {
  const iconNode = loading ? (
    <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
  ) : (
    Icon && <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {iconPosition === "start" && iconNode}
      {children}
      {iconPosition === "end" && iconNode}
    </button>
  );
}
