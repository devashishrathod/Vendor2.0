import { useMemo } from "react";
import { GROUP_LABELS, SCREEN_LABELS } from "../../config/screens";
import { useOnboardingStatusStore } from "../../store/statusStore";
import OnboardingHeader from "./OnboardingHeader";

const GROUP_COUNT = Object.keys(GROUP_LABELS).length;

/**
 * The wizard's header on the pages that follow it — plan, checkout, brand
 * outlet and under review — so the whole journey keeps one header.
 * Breadcrumb, "Step x of 5" and progress come from the server's status
 * (`groups`, `progress`), never from a local screen list.
 * @param {{
 *   screen?: string,   - server screen shown (default: status.currentScreen)
 *   title?: string, onBack?: () => void,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function OnboardingPageHeader({ screen, title, onBack, children }) {
  const status = useOnboardingStatusStore((s) => s.status);

  const header = useMemo(() => {
    const shown = screen ?? status?.currentScreen;
    const group = status?.groups?.find((g) => g.screens?.some((s) => s.screen === shown));
    return {
      crumbs: [group ? GROUP_LABELS[group.key] : GROUP_LABELS.BRAND_OUTLET, title || SCREEN_LABELS[shown] || ""],
      stepNumber: status?.progress?.group ?? 1,
      totalSteps: status?.progress?.groupCount ?? GROUP_COUNT,
      progress: status?.progress?.percent ?? 0,
    };
  }, [screen, status, title]);

  return (
    <OnboardingHeader
      crumbs={header.crumbs}
      stepNumber={header.stepNumber}
      totalSteps={header.totalSteps}
      progress={header.progress}
      onBack={onBack}
    >
      {children}
    </OnboardingHeader>
  );
}
