import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, IdCard, Pencil, TriangleAlert } from "lucide-react";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { KYC_PATHS, ONBOARDING_ERROR_CODES } from "../../config/screens";
import { ENTITY_LABELS } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addPanDetails } from "../../services/onboardingApi";
import { useSavedBrandStore } from "../../store/brandStore";
import { useVerifyStore } from "../../store/verifyStore";
import { panErrorMessage, readPanRecord } from "./verificationRecords";

const VERIFY_AGAIN = [ONBOARDING_ERROR_CODES.VERIFICATION_FAILED, ONBOARDING_ERROR_CODES.VERIFICATION_NOT_FOUND];

/**
 * PAN_VERIFICATION · review sub-step. Confirm saves
 * `add-pan-details { verificationId }` only (guide §4.5); on NO_GST the server
 * sets the legal name from the PAN and locks the business status.
 * @param {{ result: object, onChangeDetails: (message?: string, refillPan?: string) => void }} props
 */
export default function PanReviewStep({ result, onChangeDetails }) {
  const { kycPath, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const loadBrand = useSavedBrandStore((s) => s.load);
  const clearResult = useVerifyStore((s) => s.clearResult);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const record = useMemo(() => readPanRecord(result), [result]);
  const items = useMemo(
    () => [
      { label: "Name on PAN", value: record.name },
      { label: "PAN holder", value: record.holderType },
      // verify-pan `suggestedEntity` — chosen on the next screen (NO_GST).
      kycPath === KYC_PATHS.NO_GST && { label: "Suggested business type", value: ENTITY_LABELS[result.suggestedEntity] ?? null },
    ].filter(Boolean),
    [kycPath, record, result.suggestedEntity],
  );

  const handleConfirm = useCallback(async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError("");
      const res = await addPanDetails(result.verificationId);
      loadBrand({ force: true }).catch((err) => console.error("Brand refresh failed:", err));
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("PAN save failed:", err);
      const code = getErrorCode(err);
      if (VERIFY_AGAIN.includes(code)) {
        clearResult("PAN");
        onChangeDetails(panErrorMessage(err));
        return;
      }
      if (code === ONBOARDING_ERROR_CODES.PAN_NOT_IN_GSTIN) {
        clearResult("PAN");
        onChangeDetails(panErrorMessage(err), getErrorDetails(err)?.panFromGstin);
        return;
      }
      setError(panErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [clearResult, goToServerScreen, handleFlowError, loadBrand, onChangeDetails, result.verificationId, saving]);

  return (
    <StepCard
      icon={IdCard}
      title="PAN verified"
      subtitle="Review the details before continuing."
      headerAside={<StatusPill icon={Check}>Verified{result.reused ? " · already checked" : ""}</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={() => onChangeDetails()} disabled={saving}>
              Change details
            </Button>
          }
        >
          <Button onClick={handleConfirm} loading={saving} icon={ChevronRight}>
            {saving ? "Saving…" : "Confirm & continue"}
          </Button>
        </StepFooter>
      }
    >
      <VerifiedHeroCard label="PAN" value={record.pan} />
      <DetailGrid items={items} hideEmpty />
      <Notice tone="warning" icon={TriangleAlert}>
        Once saved, your PAN can only be changed through support.
        {kycPath === KYC_PATHS.NO_GST ? " The name on this PAN becomes your business's legal name." : ""}
      </Notice>
      <FormError message={error} />
    </StepCard>
  );
}
