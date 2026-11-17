import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FLOW_GROUPS, SCREENS, TOTAL_GROUPS, getFlowScreens } from "../config/onboardingFlow";
import { useOnboardingV2Store } from "../store/onboardingStore";
import { getProfileStrength } from "../utils/profileStrength";

/**
 * Builds the sidebar groups (with sub-steps) for a position in the flow.
 * @param {ReturnType<typeof getFlowScreens>} screens
 * @param {number} index - position of the current screen in `screens`
 * @param {string[]} skipped
 */
function buildGroups(screens, index, skipped) {
  const current = screens[index];
  return FLOW_GROUPS.map((group, groupIndex) => {
    const groupScreens = screens.filter((s) => s.groupId === group.id);
    const subLabels = [...new Set(groupScreens.map((s) => s.sub).filter(Boolean))];
    return {
      id: group.id,
      number: groupIndex + 1,
      label: group.label,
      status: groupIndex < current.groupIndex ? "done" : groupIndex === current.groupIndex ? "active" : "upcoming",
      subs: subLabels.map((label) => {
        const subScreens = groupScreens.filter((s) => s.sub === label);
        const isCurrent = subScreens.some((s) => s.id === current.id);
        const isPast = subScreens.every((s) => screens.indexOf(s) < index);
        return {
          label,
          // First screen of the sub-step — what its sidebar preview shows.
          screenId: subScreens[0].id,
          isNew: subScreens.some((s) => s.isNew),
          state: isCurrent ? "current" : isPast ? "done" : "upcoming",
          skipped: isPast && subScreens.some((s) => skipped.includes(s.id)),
        };
      }),
    };
  });
}

/**
 * Everything a screen, the sidebar or the header needs to know about where
 * the vendor is — all derived from FLOW_GROUPS + the store.
 */
export function useOnboardingFlow() {
  const navigate = useNavigate();
  const currentScreen = useOnboardingV2Store((s) => s.currentScreen);
  const branch = useOnboardingV2Store((s) => s.branch);
  const completed = useOnboardingV2Store((s) => s.completed);
  const skipped = useOnboardingV2Store((s) => s.skipped);
  const form = useOnboardingV2Store((s) => s.form);
  const goTo = useOnboardingV2Store((s) => s.goTo);
  const markCompleted = useOnboardingV2Store((s) => s.markCompleted);
  const markSkipped = useOnboardingV2Store((s) => s.markSkipped);
  const setBranch = useOnboardingV2Store((s) => s.setBranch);
  const returnTo = useOnboardingV2Store((s) => s.returnTo);
  const setReturnTo = useOnboardingV2Store((s) => s.setReturnTo);

  const screens = useMemo(() => getFlowScreens(branch), [branch]);
  // A persisted screen that's no longer on this branch falls back to the start.
  const index = Math.max(0, screens.findIndex((s) => s.id === currentScreen));
  const current = screens[index];
  const contractAccepted = completed.includes(SCREENS.PARTNER_CONTRACT);

  // A review screen is unreachable once its entry screen was skipped.
  const isPassable = useCallback((screen) => !(screen.reviewOf && skipped.includes(screen.reviewOf)), [skipped]);

  // Shell screens render in place; screens with a route are their own page.
  const open = useCallback(
    (screen) => {
      goTo(screen.id);
      if (screen.route) navigate(screen.route);
    },
    [goTo, navigate],
  );

  /**
   * While editing a completed step from the preview (`returnTo` set), go
   * straight back to where the vendor was — except into the review screen
   * of the screen just edited (GSTIN → GST review, PAN → PAN review, bank →
   * review), which still has to save first.
   */
  const resolveTarget = useCallback(
    (list, fromIndex, target) => {
      if (!returnTo) return target;
      const back = list.find((s) => s.id === returnTo);
      const backIndex = list.indexOf(back);
      const intoReview = target && target.reviewOf === list[fromIndex].id;
      if (!back || backIndex <= fromIndex || intoReview) return target;
      setReturnTo(null);
      return back;
    },
    [returnTo, setReturnTo],
  );

  const next = useCallback(() => {
    markCompleted(current.id);
    const target = resolveTarget(screens, index, screens.slice(index + 1).find(isPassable));
    if (target) open(target);
  }, [current.id, index, isPassable, markCompleted, open, resolveTarget, screens]);

  // Business status changes which screens follow, so the next screen is
  // looked up in the NEW branch's list, not the one rendered now. A changed
  // status means new steps to fill, so an edit's "return" is dropped then.
  const chooseBranch = useCallback(
    (nextBranch) => {
      const changed = nextBranch !== branch;
      if (changed) setReturnTo(null);
      setBranch(nextBranch);
      markCompleted(current.id);
      const list = getFlowScreens(nextBranch);
      const from = list.findIndex((s) => s.id === current.id);
      const plain = list.slice(from + 1).find(isPassable);
      const target = changed ? plain : resolveTarget(list, from, plain);
      if (target) open(target);
    },
    [branch, current.id, isPassable, markCompleted, open, resolveTarget, setBranch, setReturnTo],
  );

  // Skipping an entry screen also skips its review screen.
  const skip = useCallback(() => {
    markSkipped(current.id);
    const plain = screens.slice(index + 1).find((s) => s.reviewOf !== current.id);
    const target = resolveTarget(screens, index, plain);
    if (target) open(target);
  }, [current.id, index, markSkipped, open, resolveTarget, screens]);

  /** Start editing a completed screen; Continue returns to the current one. */
  const editScreen = useCallback(
    (screenId) => {
      if (screenId === current.id) return;
      setReturnTo(returnTo ?? current.id);
      goTo(screenId);
    },
    [current.id, goTo, returnTo, setReturnTo],
  );

  /**
   * Business status changed from the review page: switch path and open the
   * new path's first verification screen (its steps have to be done again).
   * @param {string} nextBranch
   */
  const changeBranch = useCallback(
    (nextBranch) => {
      setReturnTo(null);
      setBranch(nextBranch);
      const first = getFlowScreens(nextBranch).find((s) => s.groupId === "verification");
      if (first) goTo(first.id);
    },
    [goTo, setBranch, setReturnTo],
  );

  /** Abandon an edit and jump back to the screen it started from. */
  const cancelEdit = useCallback(() => {
    if (!returnTo) return;
    const target = returnTo;
    setReturnTo(null);
    goTo(target);
  }, [goTo, returnTo, setReturnTo]);

  const canGoBack = index > 0 && !contractAccepted;

  const back = useCallback(() => {
    if (!canGoBack) return;
    const target = screens.slice(0, index).reverse().find(isPassable);
    if (target) goTo(target.id);
  }, [canGoBack, goTo, index, isPassable, screens]);

  const groups = useMemo(() => buildGroups(screens, index, skipped), [index, screens, skipped]);
  const strength = useMemo(() => getProfileStrength({ form, completed }), [form, completed]);

  return {
    branch,
    current,
    screens,
    groups,
    stepNumber: current.groupIndex + 1,
    totalSteps: TOTAL_GROUPS,
    stepLabel: groups[current.groupIndex].label,
    progress: Math.round((index / screens.length) * 100),
    strength,
    canGoBack,
    isCompleted: (screen) => completed.includes(screen),
    isSkipped: (screen) => skipped.includes(screen),
    next,
    skip,
    back,
    goTo,
    chooseBranch,
    editScreen,
    cancelEdit,
    changeBranch,
    returnTo: screens.find((s) => s.id === returnTo) ?? null,
  };
}
