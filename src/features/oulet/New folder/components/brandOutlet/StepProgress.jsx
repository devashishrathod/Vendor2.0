const STEPS = [
  { label: "Basic Details" },
  { label: "Outlet Details" },
  { label: "Review" },
];

// Purely presentational horizontal stepper — not tied to any store, just
// mirrors the CreateBrandOutlet page's own local `wizardStep` state.
export default function StepProgress({ currentStep = 1 }) {
  return (
    <div className="flex items-center justify-center flex-wrap gap-y-2 mb-8 select-none">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-500/20"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  active ? "text-gray-900 dark:text-gray-100" : done ? "text-gray-600 dark:text-gray-300" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div className={`w-6 sm:w-12 h-0.5 rounded-full mx-2 sm:mx-3 ${done ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
