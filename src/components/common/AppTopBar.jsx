import { ArrowLeft, LogOut } from "lucide-react";
import TrydoodIcon from "@/assets/Icon.png";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import { useLogout } from "@/hooks/useLogout";

/**
 * Glass top bar for pages outside the dashboard layout (Under Review,
 * Create Brand Outlet, Subscription plan/checkout). Logo on the left,
 * theme toggle + logout on the right. Sits on top of the shared
 * `.app-shell-bg` gradient.
 *
 * @param {{ onBack?: () => void, children?: React.ReactNode }} props
 *   onBack   — shows a "Back" button next to the logo when given.
 *   children — extra items shown before the theme toggle (e.g. a chip).
 */
export default function AppTopBar({ onBack, children }) {
  const { handleLogout } = useLogout();

  return (
    <nav className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/60 bg-white/50 px-4 backdrop-blur-xl sm:px-6 dark:border-white/5 dark:bg-gray-900/50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2">
          <img src={TrydoodIcon} alt="" className="h-8 w-8 flex-shrink-0 rounded-lg object-contain" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-100">Trydood</span>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-500/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <ThemeToggleButton />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Logout
        </button>
      </div>
    </nav>
  );
}
