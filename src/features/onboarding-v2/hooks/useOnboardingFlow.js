import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FLOW_GROUPS,
  ONBOARDING_EXIT_ROUTE,
  SCREENS,
  TOTAL_GROUPS,
  getFlowScreens,
  getGroupLabel,
} from "../config/onboardingFlow";
import { useOnboardingV2Store } from "../store/onboardingStore";

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
  const goTo = useOnboardingV2Store((s) => s.goTo);
  const markCompleted = useOnboardingV2Store((s) => s.markCompleted);
  const markSkipped = useOnboardingV2Store((s) => s.markSkipped);
  const setBranch = useOnboardingV2Store((s) => s.setBranch);

  const screens = useMemo(() => getFlowScreens(branch), [branch]);
  // A persisted screen that's no longer on this branch falls back to the start.
  const index = Math.max(0, screens.findIndex((s) => s.id === currentScreen));
  const current = screens[index];
  const contractAccepted = completed.includes(SCREENS.PARTNER_CONTRACT);

  // A review screen is unreachable once its entry screen was skipped.
  const isPassable = useCallback(
    (screen) => !(screen.reviewOf && skipped.includes(screen.reviewOf)),
    [skipped],
  );

  const next = useCallback(() => {
    markCompleted(current.id);
    const target = screens.slice(index + 1).find(isPassable);
    if (target) goTo(target.id);
    else navigate(ONBOARDING_EXIT_ROUTE);
  }, [current.id, goTo, index, isPassable, markCompleted, navigate, screens]);

  // Registration status changes which screens follow, so the next screen
  // is looked up in the NEW branch's list, not the one rendered now.
  const chooseBranch = useCallback(
    (nextBranch) => {
      setBranch(nextBranch);
      markCompleted(current.id);
      const list = getFlowScreens(nextBranch);
      const from = list.findIndex((s) => s.id === current.id);
      const target = list.slice(from + 1).find(isPassable);
      if (target) goTo(target.id);
    },
    [current.id, goTo, isPassable, markCompleted, setBranch],
  );

  // Skipping an entry screen also skips its review screen.
  const skip = useCallback(() => {
    markSkipped(current.id);
    const target = screens.slice(index + 1).find((s) => s.reviewOf !== current.id);
    if (target) goTo(target.id);
  }, [current.id, goTo, index, markSkipped, screens]);

  const canGoBack = index > 0 && !contractAccepted;

  const back = useCallback(() => {
    if (!canGoBack) return;
    const target = screens.slice(0, index).reverse().find(isPassable);
    if (target) goTo(target.id);
  }, [canGoBack, goTo, index, isPassable, screens]);

  const groups = useMemo(
    () =>
      FLOW_GROUPS.map((group, groupIndex) => {
        const groupScreens = screens.filter((s) => s.groupId === group.id);
        const subLabels = [...new Set(groupScreens.map((s) => s.sub).filter(Boolean))];
        return {
          id: group.id,
          number: groupIndex + 1,
          label: getGroupLabel(group, branch),
          status: groupIndex < current.groupIndex ? "done" : groupIndex === current.groupIndex ? "active" : "upcoming",
          subs: subLabels.map((label) => {
            const subScreens = groupScreens.filter((s) => s.sub === label);
            const isCurrent = subScreens.some((s) => s.id === current.id);
            const isPast = subScreens.every((s) => screens.indexOf(s) < index);
            return {
              label,
              isNew: subScreens.some((s) => s.isNew),
              state: isCurrent ? "current" : isPast ? "done" : "upcoming",
              skipped: isPast && subScreens.some((s) => skipped.includes(s.id)),
            };
          }),
        };
      }),
    [branch, current.groupIndex, current.id, index, screens, skipped],
  );

  const activeGroup = groups[current.groupIndex];

  return {
    branch,
    current,
    screens,
    groups,
    stepNumber: current.groupIndex + 1,
    totalSteps: TOTAL_GROUPS,
    stepLabel: activeGroup.label,
    progress: Math.round((index / screens.length) * 100),
    canGoBack,
    isCompleted: (screen) => completed.includes(screen),
    isSkipped: (screen) => skipped.includes(screen),
    next,
    skip,
    back,
    goTo,
    chooseBranch,
  };
}
