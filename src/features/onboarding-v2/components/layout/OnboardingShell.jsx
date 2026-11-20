import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { GROUP_LABELS, SCREENS } from "../../config/screens";
import { canRevisit, useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { getBrand, getKycDocuments } from "../../services/onboardingApi";
import { getGroupPreview } from "../../utils/stepPreview";
import MobileStepBar from "./MobileStepBar";
import OnboardingHeader from "./OnboardingHeader";
import { BrandNameEditor, BusinessStatusEditor, CategoryEditor } from "./InlineEditors";
import StepPreviewPage from "./StepPreviewPage";
import StepSidebar from "./StepSidebar";
import Toaster from "../ui/Toaster";

/**
 * Saved brand + documents for the sidebar preview, read when a preview opens.
 * @param {string|null} groupKey
 */
function usePreviewData(groupKey) {
  const [data, setData] = useState({ brand: null, documents: null, loading: false, error: "" });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: "" }));
    try {
      const [brandRes, docsRes] = await Promise.all([getBrand(), getKycDocuments()]);
      setData({ brand: brandRes?.data ?? null, documents: docsRes?.data ?? null, loading: false, error: "" });
    } catch (error) {
      console.error("Preview data fetch failed:", error);
      setData((d) => ({ ...d, loading: false, error: error?.message || "Couldn't load your saved details." }));
    }
  }, []);

  useEffect(() => {
    if (groupKey) load();
  }, [groupKey, load]);

  return { ...data, reload: load };
}

/**
 * Page frame: fixed sidebar from lg up, a slide-in drawer below it. The
 * page itself scrolls (no fixed heights), so short laptop screens and
 * Windows display scaling never clip the step card. Sidebar, progress and
 * strength all come from the server's onboarding status.
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
  }, [flow.screen]);

  // Eye icon on a completed group → its saved details, in place of the card.
  // Preview is panel-only: it never moves the server's screen (guide §2.4).
  const [previewGroupId, setPreviewGroupId] = useState(null);
  const preview = usePreviewData(previewGroupId);
  const openPreview = useCallback(
    (groupId) => {
      closeDrawer();
      setPreviewGroupId(groupId);
      window.scrollTo({ top: 0 });
    },
    [closeDrawer],
  );
  const closePreview = useCallback(() => setPreviewGroupId(null), []);
  const previewSections = useMemo(
    () =>
      previewGroupId && flow.status
        ? getGroupPreview(previewGroupId, { status: flow.status, brand: preview.brand, documents: preview.documents })
        : [],
    [flow.status, preview.brand, preview.documents, previewGroupId],
  );
  const previewTitle = GROUP_LABELS[previewGroupId] ?? "";

  // Edit on a preview section → that screen opens (panel-only); saving it
  // keeps the server's screen where it was. Only what `editable` allows.
  const lockedIds = useMemo(
    () => previewSections.filter((s) => !canRevisit(s.screenId, flow.status)).map((s) => s.screenId),
    [flow.status, previewSections],
  );
  const editFromPreview = useCallback(
    (screenId) => {
      setPreviewGroupId(null);
      flow.openScreen(screenId);
    },
    [flow],
  );

  // After an inline edit: refresh what the preview shows, and follow the
  // server if the save moved the screen (only a business-status switch does).
  const { goToServerScreen, currentScreen } = flow;
  const reloadPreview = preview.reload;
  const afterInlineSave = useCallback(
    (data) => {
      const next = data?.currentScreen;
      if (next && next !== currentScreen) setPreviewGroupId(null);
      goToServerScreen(next);
      reloadPreview();
    },
    [currentScreen, goToServerScreen, reloadPreview],
  );

  // Basic Details sections edit right inside their preview card.
  const inlineEditors = useMemo(
    () => ({
      [SCREENS.BRAND_NAME]: (done) => <BrandNameEditor onDone={done} onSaved={afterInlineSave} />,
      [SCREENS.BUSINESS_CATEGORY]: (done) => <CategoryEditor onDone={done} onSaved={afterInlineSave} />,
      [SCREENS.REGISTRATION_STATUS]: (done) => <BusinessStatusEditor onDone={done} onSaved={afterInlineSave} />,
    }),
    [afterInlineSave],
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
          crumbs={(previewGroupId ? [previewTitle, "Preview"] : [flow.stepLabel, flow.screenTitle]).filter(Boolean)}
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          progress={flow.progress}
          onMenuClick={openDrawer}
        />
        <MobileStepBar
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          stepLabel={flow.stepLabel}
          screenTitle={flow.screenTitle}
          progress={flow.progress}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
          <div key={previewGroupId ? `preview-${previewGroupId}` : flow.screen} className="mx-auto w-full max-w-[1040px] animate-fade-up">
            {previewGroupId ? (
              <>
                {preview.error && (
                  <p className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30" role="alert">
                    {preview.error}
                  </p>
                )}
                <StepPreviewPage
                  title={previewTitle}
                  sections={preview.loading && !preview.brand ? [] : previewSections}
                  currentTitle={flow.screenTitle}
                  onClose={closePreview}
                  onEdit={editFromPreview}
                  inlineEditors={inlineEditors}
                  lockedIds={lockedIds}
                />
              </>
            ) : (
              <>
                {flow.isViewingPast && (
                  <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-inset ring-sky-200 sm:flex-row sm:items-center sm:justify-between dark:bg-sky-500/10 dark:ring-sky-500/30">
                    <p className="flex items-start gap-2 text-[13px] text-sky-900 dark:text-sky-200">
                      <Eye size={15} className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden="true" />
                      <span>
                        <strong className="font-bold">Viewing an earlier step.</strong> Saving here keeps your place — you&apos;ll
                        return to where you left off.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={flow.closeScreen}
                      className="min-h-9 shrink-0 self-start rounded-lg px-3 text-xs font-bold text-sky-800 ring-1 ring-inset ring-sky-300 hover:bg-sky-100 sm:self-auto dark:text-sky-200 dark:ring-sky-500/40 dark:hover:bg-sky-500/20"
                    >
                      Back to current step
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
