import OnboardingShell from "../components/layout/OnboardingShell";
import { STEP_ELEMENTS } from "../config/stepComponents";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";

/** Onboarding v2 entry: the shell plus whichever screen the vendor is on. */
export default function OnboardingPage() {
  const { current } = useOnboardingFlow();
  return <OnboardingShell>{STEP_ELEMENTS[current.id]}</OnboardingShell>;
}
