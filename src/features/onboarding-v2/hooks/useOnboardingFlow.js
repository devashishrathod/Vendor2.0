import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import { isWizardScreen, routeForScreen } from "../config/routes";
import { GROUP_LABELS, KYC_PATHS, ONBOARDING_ERROR_CODES, SCREEN_LABELS, SCREENS } from "../config/screens";
import { useOnboardingStatusStore } from "../store/statusStore";
import { useToastStore } from "../store/toastStore";

const GROUP_STATE = Object.freeze({ DONE: "done", IN_PROGRESS: "active", UPCOMING: "upcoming" });

/**
 * Whether an earlier screen may be opened again from Back (panel-only — the
 * server's screen does not move). Mirrors `status.editable` (guide §3, §4.8);
 * verified GST / PAN / bank are view-only, so they are not reopened.
 * @param {string} screen
 * @param {import('../types').OnboardingStatus|null} status
 */
export function canRevisit(screen, status) {
  const editable = status?.editable;
  if (!editable) return false;
  switch (screen) {
    case SCREENS.BRAND_NAME:
    case SCREENS.BUSINESS_CATEGORY:
      return editable.legal;
    case SCREENS.REGISTRATION_STATUS:
      return editable.registrationStatus && !status.registrationStatusLocked;
    case SCREENS.REGISTRATION_ENTITY_TYPE:
      // GST path: the entity comes from GST and is read-only (guide §4.6).
      return editable.entity && status.kycPath === KYC_PATHS.NO_GST;
    case SCREENS.OWNER_VERIFICATION:
      return editable.ownerVerification;
    case SCREENS.KYC_DOCUMENTS:
      return Boolean(editable.documents?.add || editable.documents?.change);
    case SCREENS.BRAND_BASIC_DETAILS:
      return Boolean(editable.profile?.add || editable.profile?.change);
    case SCREENS.BRAND_PROFESSIONAL_DETAILS:
    case SCREENS.OUTLET_DETAILS:
      return Boolean(editable.setup?.add || editable.setup?.change);
    default:
      return false;
  }
}

/**
 * Sidebar groups from `status.groups` — only the brand's own path's screens
 * are listed (the server never sends the others).
 * @param {import('../types').OnboardingStatus|null} status
 * @param {string|null} shown
 */
function buildSidebarGroups(status, shown) {
  return (status?.groups ?? []).map((group, index) => ({
    id: group.key,
    number: index + 1,
    label: GROUP_LABELS[group.key] ?? group.key,
    status: GROUP_STATE[group.state] ?? "upcoming",
    subs: (group.screens ?? []).map(({ screen, status: screenStatus }) => ({
      label: SCREEN_LABELS[screen] ?? screen,
      screenId: screen,
      isNew: false,
      state: screen === shown ? "current" : screenStatus === "MISSING" ? "upcoming" : "done",
      skipped: screenStatus === "SKIPPED",
    })),
  }));
}

/**
 * Where the vendor is and how to move — all from the server's onboarding
 * status. The panel never decides the next screen: every save / skip /
 * continue response carries `currentScreen`, and goToServerScreen() shows it.
 */
export function useOnboardingFlow() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const status = useOnboardingStatusStore((s) => s.status);
  const viewScreen = useOnboardingStatusStore((s) => s.viewScreen);
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const applyScreen = useOnboardingStatusStore((s) => s.applyScreen);
  const openScreen = useOnboardingStatusStore((s) => s.openScreen);
  const closeScreen = useOnboardingStatusStore((s) => s.closeScreen);
  const pushToast = useToastStore((s) => s.push);

  const currentScreen = status?.currentScreen ?? null;
  // An earlier screen opened from Back, else the server's screen.
  const screen = viewScreen ?? currentScreen;
  const isViewingPast = Boolean(viewScreen && viewScreen !== currentScreen);

  const goToRoute = useCallback(
    (nextScreen) => {
      const route = routeForScreen(nextScreen);
      if (route !== pathname) navigate(route);
    },
    [navigate, pathname],
  );

  /**
   * Shows the screen a response returned (`data.currentScreen`). Without
   * one, re-reads the status and routes from it.
   * @param {string|null|undefined} nextScreen
   */
  const goToServerScreen = useCallback(
    (nextScreen) => {
      if (nextScreen) {
        applyScreen(nextScreen);
        // A screen opened from Back / review / a fix was saved and the
        // server's screen didn't move: show the current one again right here
        // (a revoked vendor's screen is DASHBOARD — don't route there).
        if (viewScreen && nextScreen === currentScreen) return;
        goToRoute(nextScreen);
        return;
      }
      closeScreen();
      fetchStatus()
        .then((fresh) => {
          if (!viewScreen || fresh?.currentScreen !== currentScreen) goToRoute(fresh?.currentScreen);
        })
        .catch((error) => console.error("Onboarding status refresh failed:", error));
    },
    [applyScreen, closeScreen, currentScreen, fetchStatus, goToRoute, viewScreen],
  );

  /**
   * `409 ONBOARDING_SCREEN_MISMATCH` (another tab, or an admin moved the
   * vendor): go to `details.currentScreen`, refresh, small toast (guide §2.6).
   * @param {unknown} error
   * @returns {boolean} true when handled
   */
  const handleFlowError = useCallback(
    (error) => {
      if (getErrorCode(error) !== ONBOARDING_ERROR_CODES.SCREEN_MISMATCH) return false;
      pushToast({ tone: "info", message: "Your progress changed elsewhere, so we've opened the step you're on now." });
      goToServerScreen(getErrorDetails(error)?.currentScreen);
      return true;
    },
    [goToServerScreen, pushToast],
  );

  const pathScreens = useMemo(
    () => (status?.groups ?? []).flatMap((g) => (g.screens ?? []).map((s) => s.screen)),
    [status],
  );

  const previousScreen = useMemo(() => {
    const index = pathScreens.indexOf(screen);
    if (index <= 0) return null;
    return (
      pathScreens
        .slice(0, index)
        .reverse()
        .find((s) => isWizardScreen(s) && canRevisit(s, status)) ?? null
    );
  }, [pathScreens, screen, status]);

  const back = useCallback(() => {
    if (previousScreen) openScreen(previousScreen);
  }, [openScreen, previousScreen]);

  const groups = useMemo(() => buildSidebarGroups(status, screen), [screen, status]);
  const activeGroup = groups.find((g) => g.subs.some((s) => s.screenId === screen)) ?? groups.find((g) => g.status === "active");
  const strength = status?.profileStrength
    ? { score: status.profileStrength.score, level: status.profileStrength.level }
    : null;

  return {
    status,
    currentScreen,
    screen,
    screenTitle: SCREEN_LABELS[screen] ?? "",
    isViewingPast,
    kycPath: status?.kycPath ?? null,
    limits: status?.limits ?? null,
    editable: status?.editable ?? null,
    groups,
    stepNumber: status?.progress?.group ?? 1,
    totalSteps: status?.progress?.groupCount ?? Object.keys(GROUP_LABELS).length,
    stepLabel: activeGroup?.label ?? "",
    progress: status?.progress?.percent ?? 0,
    strength,
    canGoBack: Boolean(previousScreen),
    back,
    openScreen,
    closeScreen,
    goToServerScreen,
    handleFlowError,
  };
}
