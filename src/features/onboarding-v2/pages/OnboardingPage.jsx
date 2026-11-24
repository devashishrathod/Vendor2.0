import { Navigate } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import OnboardingShell from "../components/layout/OnboardingShell";
import { isWizardScreen, routeForScreen } from "../config/routes";
import { STEP_ELEMENTS } from "../config/stepComponents";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";

function UnknownScreen({ screen }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30" role="alert">
      <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        This panel can&apos;t show the step your account is on{screen ? ` (${screen})` : ""}. Please refresh, or contact support if
        it stays.
      </p>
    </div>
  );
}

/**
 * Onboarding wizard (/onboarding): the shell plus the screen the SERVER says
 * the vendor is on (`status.currentScreen`), or an earlier one opened from
 * Back. Screens that live on other pages redirect there.
 */
export default function OnboardingPage() {
  const { currentScreen, screen } = useOnboardingFlow();

  if (currentScreen && !isWizardScreen(currentScreen)) {
    return <Navigate to={routeForScreen(currentScreen)} replace />;
  }
  return <OnboardingShell>{STEP_ELEMENTS[screen] ?? <UnknownScreen screen={screen} />}</OnboardingShell>;
}
