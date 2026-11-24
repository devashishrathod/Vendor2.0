import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OnboardingShell from "../components/layout/OnboardingShell";
import { LIVE_DASHBOARD_ROUTE, routeForScreen } from "../config/routes";
import { SCREENS } from "../config/screens";
import { STEP_ELEMENTS } from "../config/stepComponents";
import { useOnboardingStatusStore } from "../store/statusStore";
import ReviewStep from "../steps/review/ReviewStep";
import ApprovedView from "../steps/status/ApprovedView";
import UnderReviewView from "../steps/status/UnderReviewView";

/**
 * Whether the brand has something to show here: under review, sent back
 * (rejected / revoked → remediation), or approved but not yet seen.
 * @param {import('../types').OnboardingStatus} status
 */
function hasReviewState(status) {
  const v = status.verification ?? {};
  return v.isRevoked || v.isRejected || (v.isApproved && !v.isApprovalAcknowledged) || status.editLock === "PENDING";
}

/**
 * After submit (/under-review, guide §7 and §9), inside the onboarding
 * shell: congratulations when approved, the review page in REMEDIATION
 * (reason on top, every locked section open, Resubmit), otherwise the
 * under-review status. A fix opens that screen right here (panel-only),
 * and its save comes back. A revoked vendor stays on DASHBOARD and reaches
 * this page from the dashboard banner.
 */
export default function ReviewStatusPage() {
  const status = useOnboardingStatusStore((s) => s.status);
  const viewScreen = useOnboardingStatusStore((s) => s.viewScreen);
  const currentScreen = status?.currentScreen ?? null;

  if (!status) return null;
  if (currentScreen !== SCREENS.UNDER_REVIEW && currentScreen !== SCREENS.DASHBOARD) {
    return <Navigate to={routeForScreen(currentScreen)} replace />;
  }
  if (currentScreen === SCREENS.DASHBOARD && !hasReviewState(status)) {
    return <Navigate to={LIVE_DASHBOARD_ROUTE} replace />;
  }

  const v = status.verification ?? {};
  let view = <UnderReviewView />;
  if (v.isApproved && !v.isApprovalAcknowledged) view = <ApprovedView />;
  else if (status.editMode === "REMEDIATION" || v.isRejected || v.isRevoked) view = <ReviewStep />;

  return (
    <OnboardingShell>
      {currentScreen === SCREENS.DASHBOARD && !viewScreen && (
        <Link
          to={LIVE_DASHBOARD_ROUTE}
          className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to dashboard
        </Link>
      )}
      {viewScreen ? STEP_ELEMENTS[viewScreen] ?? view : view}
    </OnboardingShell>
  );
}
