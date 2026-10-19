import { cx } from "../utils/outletUtils";

/**
 * Striped shop canopy with a scalloped edge (styles in index.css).
 * `children` sit on the stripes (checkbox, type pill, back button...).
 */
export function StoreAwning({ variant, height = "h-[52px]", className, children }) {
  return (
    <div className={cx(`awning-${variant}`, className)}>
      <div className={cx("awning-stripes relative", height)}>{children}</div>
      <div aria-hidden="true" className="awning-scallops" />
    </div>
  );
}

/** Hanging OPEN / CLOSED board, strung from a nail under the awning. */
export function OpenSign({ open, size = "sm", className }) {
  return (
    <div aria-hidden="true" className={cx("sign-swing pointer-events-none flex flex-col items-center", className)}>
      <svg width={size === "lg" ? 72 : 56} height="18" viewBox="0 0 56 18" fill="none" preserveAspectRatio="none">
        <path d="M10 18 L28 1 L46 18" stroke="#6B7280" strokeWidth="1.5" />
        <circle cx="28" cy="2" r="2" fill="#6B7280" />
      </svg>
      <span
        className={cx(
          "-mt-px rounded-lg border-2 bg-white font-extrabold tracking-[0.14em] shadow-md dark:bg-gray-900",
          size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-[11px]",
          open
            ? "-rotate-[4deg] border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
            : "rotate-[5deg] border-gray-500 text-gray-600 dark:border-gray-500 dark:text-gray-300"
        )}
      >
        {open ? "OPEN" : "CLOSED"}
      </span>
    </div>
  );
}

/** Rounded store icon tile, tinted to match the awning. */
export function StoreTile({ variant, size = "md" }) {
  const tint = {
    own: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    franchise: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    closed: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  }[variant];
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center",
        size === "lg" ? "h-16 w-16 rounded-2xl" : "h-[46px] w-[46px] rounded-[14px]",
        tint
      )}
    >
      <svg
        width={size === "lg" ? 30 : 22}
        height={size === "lg" ? 30 : 22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9 4.5 4h15L21 9" />
        <path d="M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
        <path d="M5 13v7h14v-7" />
        <path d="M10 20v-4h4v4" />
      </svg>
    </span>
  );
}
