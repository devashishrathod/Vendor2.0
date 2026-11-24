/**
 * Phones/tablets only (the sidebar is hidden below lg): current step name
 * and a slim progress bar under the header.
 * @param {{ stepNumber: number, totalSteps: number, stepLabel: string, screenTitle: string, progress: number }} props
 */
export default function MobileStepBar({ stepNumber, totalSteps, stepLabel, screenTitle, progress }) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:hidden dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-bold text-gray-900 dark:text-gray-50">
          {stepLabel}
          <span className="font-medium text-gray-500"> · {screenTitle}</span>
        </p>
        <span className="shrink-0 text-xs font-semibold text-gray-500">
          Step {stepNumber}/{totalSteps}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800" aria-hidden="true">
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
