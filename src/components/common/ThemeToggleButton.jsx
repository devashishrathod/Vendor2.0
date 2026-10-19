import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Icon-only light/dark toggle — drops into any header's action row.
 * Reads/writes the same app-wide ThemeContext the Settings page's
 * Appearance section uses, so it always reflects the current theme.
 * `onColor` switches to the round translucent-white style used on the
 * green dashboard header bar.
 */
export default function ThemeToggleButton({ className = "", onColor = false }) {
  const { isDark, toggleTheme } = useTheme();

  const look = onColor
    ? "rounded-full bg-white/60 text-gray-700 ring-1 ring-white/80 hover:bg-white/90 hover:text-emerald-700 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/15"
    : "rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer ${look} ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
