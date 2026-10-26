import { useCallback, useEffect, useState } from "react";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import MobileStepBar from "./MobileStepBar";
import OnboardingHeader from "./OnboardingHeader";
import StepSidebar from "./StepSidebar";

/**
 * Page frame: fixed sidebar from lg up, a slide-in drawer below it. The
 * page itself scrolls (no fixed heights), so short laptop screens and
 * Windows display scaling never clip the step card.
 * @param {{ children: import('react').ReactNode }} props
 */
export default function OnboardingShell({ children }) {
  const flow = useOnboardingFlow();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  // Each new screen starts at the top on phones, where the page scrolls.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [flow.current.id]);

  const handleBack = useCallback(() => {
    flow.back();
    closeDrawer();
  }, [flow, closeDrawer]);

  const sidebarProps = {
    groups: flow.groups,
    progress: flow.progress,
    stepNumber: flow.stepNumber,
    totalSteps: flow.totalSteps,
    canGoBack: flow.canGoBack,
    onBack: handleBack,
  };

  return (
    <div className="flex min-h-dvh overflow-x-clip bg-app font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-gray-200 lg:block dark:border-gray-800">
        <StepSidebar {...sidebarProps} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Onboarding steps">
          <button
            type="button"
            aria-label="Close steps"
            onClick={closeDrawer}
            className="absolute inset-0 h-full w-full animate-fade-in cursor-default bg-gray-900/40 backdrop-blur-sm"
          />
          <div className="relative h-full w-[min(18rem,85vw)] shadow-2xl">
            <StepSidebar {...sidebarProps} onClose={closeDrawer} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <OnboardingHeader
          crumbs={[flow.stepLabel, flow.current.title]}
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          progress={flow.progress}
          onMenuClick={openDrawer}
        />
        <MobileStepBar
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          stepLabel={flow.stepLabel}
          screenTitle={flow.current.title}
          progress={flow.progress}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
          <div key={flow.current.id} className="mx-auto w-full max-w-[1040px] animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
