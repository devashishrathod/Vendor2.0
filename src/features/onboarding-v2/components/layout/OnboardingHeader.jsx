import { ChevronRight, CircleQuestionMark, CloudCheck, House, Menu, User } from "lucide-react";
import { HELPDESK_EMAIL } from "../../constants/onboardingOptions";
import ProgressRing from "./ProgressRing";

/**
 * Top bar. Phones/tablets get a menu button (opens the steps drawer) and
 * the brand mark; the breadcrumb appears from md, the save note from xl.
 * @param {{
 *   crumbs: string[], stepNumber: number, totalSteps: number,
 *   progress: number, onMenuClick: () => void,
 * }} props
 */
export default function OnboardingHeader({ crumbs, stepNumber, totalSteps, progress, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open onboarding steps"
          className="-ml-1.5 grid size-10 shrink-0 place-items-center rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 md:hidden">
          <span className="grid size-8 place-items-center rounded-[9px] bg-emerald-600 text-[15px] font-extrabold text-white">T</span>
          <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-gray-50">Trydood</span>
        </span>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
          <ol className="flex min-w-0 items-center gap-2 text-[13.5px]">
            <li className="shrink-0 text-gray-500">
              <House size={16} strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">Onboarding</span>
            </li>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={crumb} className={`flex min-w-0 items-center gap-2 ${isLast ? "" : "max-lg:hidden"}`}>
                  <ChevronRight size={14} strokeWidth={2.5} className="shrink-0 text-gray-300" aria-hidden="true" />
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={`truncate ${isLast ? "font-bold text-gray-900 dark:text-gray-50" : "font-medium text-gray-500"}`}
                  >
                    {crumb}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3.5">
        <span className="hidden items-center gap-1.5 text-[12.5px] font-medium text-gray-500 xl:flex">
          <CloudCheck size={16} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />
          Progress saved
        </span>
        <span className="hidden h-6 w-px bg-gray-200 xl:block dark:bg-gray-700" aria-hidden="true" />
        <span className="flex items-center gap-2 rounded-full bg-emerald-50 py-1 pl-1.5 pr-1.5 ring-1 ring-inset ring-emerald-200 sm:pr-2.5 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
          <ProgressRing value={progress} />
          <span className="hidden text-[12.5px] font-bold text-emerald-700 sm:inline dark:text-emerald-400">
            Step {stepNumber} of {totalSteps} · {progress}%
          </span>
          <span className="sr-only sm:hidden">
            Step {stepNumber} of {totalSteps}, {progress}% complete
          </span>
        </span>
        <a
          href={`mailto:${HELPDESK_EMAIL}`}
          aria-label="Get help"
          className="grid size-10 place-items-center rounded-[10px] bg-white text-gray-600 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800"
        >
          <CircleQuestionMark size={17} strokeWidth={2} aria-hidden="true" />
        </a>
        <span className="hidden size-10 place-items-center rounded-full bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200 sm:grid dark:bg-gray-800 dark:ring-gray-700">
          <User size={18} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
    </header>
  );
}
