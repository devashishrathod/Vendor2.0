import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Pencil, ReceiptText, TriangleAlert } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addGstDetails } from "../../services/onboardingApi";
import { useSavedBrandStore } from "../../store/brandStore";
import { useVerifyStore } from "../../store/verifyStore";
import { gstErrorMessage, readGstRecord } from "./verificationRecords";

/** Codes that mean "this verification can't be saved — verify again". */
const VERIFY_AGAIN = [ONBOARDING_ERROR_CODES.VERIFICATION_FAILED, ONBOARDING_ERROR_CODES.VERIFICATION_NOT_FOUND];

/**
 * GST_VERIFICATION · review sub-step (panel-only). Shows verify-gst's mapped
 * `details`; Confirm saves `add-gst-details { verificationId }` — the server
 * fills the legal name and entity from GST and answers with the next screen.
 * @param {{ result: object, onChangeDetails: (message?: string) => void }} props
 */
export default function GstReviewStep({ result, onChangeDetails }) {
  const { goToServerScreen, handleFlowError } = useOnboardingFlow();
  const loadBrand = useSavedBrandStore((s) => s.load);
  const clearResult = useVerifyStore((s) => s.clearResult);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const record = useMemo(() => readGstRecord(result), [result]);
  const items = useMemo(
    () => [
      { label: "Legal business name", value: record.legalName },
      { label: "Trade name", value: record.tradeName },
      { label: "Business structure", value: record.constitution },
      { label: "Taxpayer type", value: record.taxpayerType },
      { label: "Registration date", value: record.registrationDate },
      { label: "Registered business address", value: record.address, wide: true },
    ],
    [record],
  );

  const handleConfirm = useCallback(async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError("");
      const res = await addGstDetails(result.verificationId);
      // The server filled the legal name / entity — refresh the saved brand.
      loadBrand({ force: true }).catch((err) => console.error("Brand refresh failed:", err));
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("GST save failed:", err);
      if (VERIFY_AGAIN.includes(getErrorCode(err))) {
        clearResult("GST");
        onChangeDetails(gstErrorMessage(err));
        return;
      }
      // GSTIN_NOT_ACTIVE, BILLING_STATE_GSTIN_MISMATCH, PAN_NOT_IN_GSTIN, DOCUMENT_IN_USE …
      setError(gstErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [clearResult, goToServerScreen, handleFlowError, loadBrand, onChangeDetails, result.verificationId, saving]);

  return (
    <StepCard
      icon={ReceiptText}
      title="GST registration verified"
      subtitle="Review your verified business details before continuing."
      headerAside={<StatusPill icon={Check}>Verified · Active</StatusPill>}
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
      <VerifiedHeroCard label="Business GSTIN" value={record.gstNumber} />
      <DetailGrid items={items} hideEmpty />
      <Notice tone="warning" icon={TriangleAlert}>
        Once saved, your GSTIN and business status can only be changed through support.
      </Notice>
      <FormError message={error} />
    </StepCard>
  );
}
