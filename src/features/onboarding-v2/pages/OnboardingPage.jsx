import { Navigate } from "react-router-dom";
import OnboardingShell from "../components/layout/OnboardingShell";
import { STEP_ELEMENTS } from "../config/stepComponents";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";

/** Onboarding wizard (steps 1–4): the shell plus whichever screen the vendor is on. */
export default function OnboardingPage() {
  const { current } = useOnboardingFlow();
  // A vendor who already reached plan / payment / outlet resumes on that page.
  if (current.route) return <Navigate to={current.route} replace />;
  return <OnboardingShell>{STEP_ELEMENTS[current.id]}</OnboardingShell>;
}
