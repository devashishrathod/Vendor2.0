import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { SCREENS } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { getAllPreviews } from "../../utils/stepPreview";
import { selectStatusLocked } from "../../utils/statusLock";
import MobileStepBar from "./MobileStepBar";
import OnboardingHeader from "./OnboardingHeader";
import { BrandNameEditor, BusinessStatusEditor, CategoryEditor } from "./InlineEditors";
import StepPreviewPage from "./StepPreviewPage";
import StepSidebar from "./StepSidebar";
import Toaster from "../ui/Toaster";

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

  // Eye icon on a completed main step (Basic Details, Business Verification…)
  // → that step's details shown in the page, in place of the current card.
  const form = useOnboardingV2Store((s) => s.form);
  const skipped = useOnboardingV2Store((s) => s.skipped);
  const [previewGroupId, setPreviewGroupId] = useState(null);
  const openPreview = useCallback(
    (groupId) => {
      closeDrawer();
      setPreviewGroupId(groupId);
      window.scrollTo({ top: 0 });
    },
    [closeDrawer],
  );
  const closePreview = useCallback(() => setPreviewGroupId(null), []);
  const previewSections = useMemo(() => {
    if (!previewGroupId) return [];
    const group = flow.groups.find((g) => g.id === previewGroupId);
    return group ? getAllPreviews([group], { form, branch: flow.branch, skipped })[0]?.sections ?? [] : [];
  }, [flow.branch, flow.groups, form, previewGroupId, skipped]);
  const previewTitle = flow.groups.find((g) => g.id === previewGroupId)?.label;

  // Pencil on a preview section → open that screen (data already filled in);
  // Continue from there walks forward again. Locked once the contract is accepted.
  const editLocked = flow.isCompleted(SCREENS.PARTNER_CONTRACT);
  // Business status can't change once its business verification is done.
  const statusLocked = useOnboardingV2Store(selectStatusLocked);
  const editFromPreview = useCallback(
    (screenId) => {
      setPreviewGroupId(null);
      flow.editScreen(screenId);
    },
    [flow],
  );

  // Basic Details sections edit right inside their review card.
  const inlineEditors = useMemo(
    () => ({
      [SCREENS.BRAND_NAME]: (done) => <BrandNameEditor onDone={done} />,
      [SCREENS.CATEGORY]: (done) => <CategoryEditor onDone={done} />,
      [SCREENS.BUSINESS_STATUS]: (done) => (
        <BusinessStatusEditor
          onDone={done}
          onBranchChange={(nextBranch) => {
            setPreviewGroupId(null);
            flow.changeBranch(nextBranch);
          }}
        />
      ),
    }),
    [flow],
  );

  const handleBack = useCallback(() => {
    setPreviewGroupId(null);
    flow.back();
    closeDrawer();
  }, [flow, closeDrawer]);

  const sidebarProps = {
    groups: flow.groups,
    progress: flow.progress,
    stepNumber: flow.stepNumber,
    totalSteps: flow.totalSteps,
    strength: flow.strength,
    canGoBack: flow.canGoBack,
    onBack: handleBack,
    onPreview: openPreview,
  };

  return (
    <div className="flex min-h-dvh overflow-x-clip bg-app font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Toaster />
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
          crumbs={previewGroupId ? [previewTitle, "Preview"] : [flow.stepLabel, flow.current.title]}
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
          <div key={previewGroupId ? `preview-${previewGroupId}` : flow.current.id} className="mx-auto w-full max-w-[1040px] animate-fade-up">
            {previewGroupId ? (
              <StepPreviewPage
                title={previewTitle}
                sections={previewSections}
                currentTitle={flow.current.title}
                onClose={closePreview}
                onEdit={editLocked ? undefined : editFromPreview}
                inlineEditors={editLocked ? undefined : inlineEditors}
                lockedIds={statusLocked ? [SCREENS.BUSINESS_STATUS] : []}
              />
            ) : (
              <>
                {flow.returnTo && flow.returnTo.id !== flow.current.id && (
                  <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-inset ring-sky-200 sm:flex-row sm:items-center sm:justify-between dark:bg-sky-500/10 dark:ring-sky-500/30">
                    <p className="flex items-start gap-2 text-[13px] text-sky-900 dark:text-sky-200">
                      <Pencil size={15} className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
                      <span>
                        <strong className="font-bold">Editing a completed step.</strong> Continue takes you back to{" "}
                        <strong className="font-bold">{flow.returnTo.title}</strong>.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={flow.cancelEdit}
                      className="min-h-9 shrink-0 self-start rounded-lg px-3 text-xs font-bold text-sky-800 ring-1 ring-inset ring-sky-300 hover:bg-sky-100 sm:self-auto dark:text-sky-200 dark:ring-sky-500/40 dark:hover:bg-sky-500/20"
                    >
                      Cancel edit
                    </button>
                  </div>
                )}
                {children}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
