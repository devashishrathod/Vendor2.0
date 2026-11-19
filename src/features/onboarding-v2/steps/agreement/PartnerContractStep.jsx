import { useCallback, useState } from "react";
import { Check, FileText, Lock } from "lucide-react";
import { ANALYTICS_EVENTS } from "@/constants/analytics";
import { trackEvent } from "@/utils/analytics";
import Button from "../../components/ui/Button";
import DeedContent, { DeedAgreeCheckbox } from "../../components/deed/DeedContent";
import FormError from "../../components/ui/FormError";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { acceptPartnership } from "../../services/onboardingApi";

/**
 * PARTNERSHIP_DEED (guide §4.10). Accept → PUT accept-partnership; the
 * response's `currentScreen` is next (SUBSCRIBE_PLAN, or BRAND_BASIC_DETAILS
 * when an admin already granted a plan). Accepted = `status.deed.accepted`.
 */
export default function PartnerContractStep() {
  const { status, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const locked = Boolean(status?.deed?.accepted);
  const [agreed, setAgreed] = useState(locked);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const handleAccept = useCallback(async () => {
    if (locked || !agreed || accepting) return;
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await acceptPartnership();
      const nextScreen = res?.data?.currentScreen;
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETE, { step_name: "PARTNERSHIP_DEED", next_step: nextScreen });
      goToServerScreen(nextScreen);
    } catch (error) {
      if (handleFlowError(error)) return;
      console.error("Accepting partner contract failed:", error);
      setAcceptError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }, [accepting, agreed, goToServerScreen, handleFlowError, locked]);

  return (
    <StepCard
      icon={FileText}
      title="Partner Deed Agreement"
      subtitle={locked ? "Agreement already accepted" : "Review and accept to continue"}
      footer={
        <StepFooter start={<FormError message={acceptError} />}>
          <Button onClick={handleAccept} disabled={!agreed || locked} loading={accepting} icon={locked ? Lock : Check} iconPosition="start">
            {accepting ? "Processing..." : "Accept & continue"}
          </Button>
        </StepFooter>
      }
    >
      <DeedContent intro="You're nearly there! Review and accept the partner agreement below to continue with Trydood." />
      <DeedAgreeCheckbox checked={locked || agreed} disabled={locked} onChange={setAgreed} />
    </StepCard>
  );
}
