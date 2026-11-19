import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import OnboardingShell from "../components/layout/OnboardingShell";
import { SCREEN_ROUTES } from "../config/routes";
import { STEP_ELEMENTS } from "../config/stepComponents";
import { useOnboardingFlow } from "../hooks/useOnboardingFlow";

/** Onboarding wizard (steps 1–4): the shell plus whichever screen the vendor is on. */
export default function OnboardingPage() {
  const { current } = useOnboardingFlow();
  const authScreen = useAuthStore((s) => s.currentScreen);
  // The backend already has the vendor past the wizard (plan, outlet, under
  // review, dashboard) — resume there, even if this browser's wizard state
  // is empty or behind (new device, after logout).
  const backendRoute = SCREEN_ROUTES[authScreen];
  if (backendRoute) return <Navigate to={backendRoute} replace />;
  // A vendor who already reached plan / payment / outlet resumes on that page.
  if (current.route) return <Navigate to={current.route} replace />;
  return <OnboardingShell>{STEP_ELEMENTS[current.id]}</OnboardingShell>;
}
