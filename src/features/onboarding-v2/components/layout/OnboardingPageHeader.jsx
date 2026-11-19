import { useMemo } from "react";
import { FLOW_GROUPS, TOTAL_GROUPS, getFlowScreens } from "../../config/onboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import OnboardingHeader from "./OnboardingHeader";

const LAST_GROUP = FLOW_GROUPS[FLOW_GROUPS.length - 1];

/**
 * The wizard's header on the pages that follow it — plan, checkout, brand
 * outlet, system verification and under review — so the whole journey keeps
 * one header. Breadcrumb, "Step x of 5" and progress come from the flow
 * config: a `screenId` in the flow (PLAN, PAYMENT, OUTLET) uses its own
 * position; pages after the flow (verification, under review) sit on the
 * last step at 100%.
 * @param {{
 *   screenId?: string, title: string, onBack?: () => void,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function OnboardingPageHeader({ screenId, title, onBack, children }) {
  const branch = useOnboardingV2Store((s) => s.branch);

  const header = useMemo(() => {
    const screens = getFlowScreens(branch);
    const index = screenId ? screens.findIndex((s) => s.id === screenId) : -1;
    if (index === -1) {
      return { crumbs: [LAST_GROUP.label, title], stepNumber: TOTAL_GROUPS, progress: 100 };
    }
    const screen = screens[index];
    return {
      crumbs: [FLOW_GROUPS[screen.groupIndex].label, title || screen.title],
      stepNumber: screen.groupIndex + 1,
      progress: Math.round((index / screens.length) * 100),
    };
  }, [branch, screenId, title]);

  return (
    <OnboardingHeader
      crumbs={header.crumbs}
      stepNumber={header.stepNumber}
      totalSteps={TOTAL_GROUPS}
      progress={header.progress}
      onBack={onBack}
    >
      {children}
    </OnboardingHeader>
  );
}
