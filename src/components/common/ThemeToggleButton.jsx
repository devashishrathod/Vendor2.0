import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Icon-only light/dark toggle — drops into any header's action row.
 * Reads/writes the same app-wide ThemeContext the Settings page's
 * Appearance section uses, so it always reflects the current theme.
 */
export default function ThemeToggleButton({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
