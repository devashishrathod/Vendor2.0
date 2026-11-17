import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Pencil, ReceiptText, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import Notice from "../../components/ui/Notice";
import FormError from "../../components/ui/FormError";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { SCREENS } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { readGstRecord, saveGstPath } from "./verificationRecords";

/**
 * Screen 07 · GST review. Shows the verified GST record; Continue saves
 * names → status → entity type → PAN → GST on the backend, in that order.
 */
export default function GstReviewStep() {
  const { next, goTo } = useOnboardingFlow();
  const gstin = useOnboardingV2Store((s) => s.form.gstin);
  const gstDetails = useOnboardingV2Store((s) => s.form.gstDetails);
  const panDetails = useOnboardingV2Store((s) => s.form.panDetails);
  const pan = useOnboardingV2Store((s) => s.form.pan);
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const record = useMemo(() => readGstRecord(gstDetails), [gstDetails]);
  const items = useMemo(
    () => [
      { label: "Legal business name", value: record.legalName },
      { label: "Trade name", value: record.tradeName },
      { label: "Business structure", value: record.constitution },
      { label: "Taxpayer type", value: record.taxpayerType },
      { label: "Registration date", value: record.registrationDate },
      { label: "Nature of business", value: record.natureOfBusiness },
      { label: "Registered business address", value: record.address, wide: true },
    ],
    [record],
  );

  const changeDetails = useCallback(() => goTo(SCREENS.GST_ENTER), [goTo]);

  const handleContinue = useCallback(async () => {
    if (!gstDetails || saving) return;
    try {
      setSaving(true);
      setError("");
      const result = await saveGstPath({ brandName, gstDetails, panDetails, pan });
      setField("legalName", result.legalName);
      setField("entityType", result.entityType);
      if (result.panDetails !== panDetails) setField("panDetails", result.panDetails);
      next();
    } catch (err) {
      console.error("GST path save failed:", err);
      setError(err?.message || "We couldn't save your GST details. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [brandName, gstDetails, next, pan, panDetails, saving, setField]);

  return (
    <StepCard
      icon={ReceiptText}
      title="GST registration verified"
      subtitle="Review your verified business details before continuing."
      headerAside={
        gstDetails && <StatusPill icon={Check}>Verified · Active</StatusPill>
      }
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={changeDetails} disabled={saving}>
              Change details
            </Button>
          }
        >
          <Button onClick={handleContinue} disabled={!gstDetails} loading={saving} icon={ChevronRight}>
            {saving ? "Saving…" : "Continue to Business PAN"}
          </Button>
        </StepFooter>
      }
    >
      {gstDetails ? (
        <>
          <VerifiedHeroCard label="Business GSTIN" value={record.gstNumber || gstin} />
          <DetailGrid items={items} />
          <Notice tone="warning" icon={TriangleAlert}>
            Please confirm these details match your GST registration records before continuing.
          </Notice>
        </>
      ) : (
        <Notice tone="warning" icon={TriangleAlert}>
          We don&apos;t have verified GST details yet. Use &ldquo;Change details&rdquo; to enter and verify your GSTIN.
        </Notice>
      )}

      <FormError message={error} />
    </StepCard>
  );
}
