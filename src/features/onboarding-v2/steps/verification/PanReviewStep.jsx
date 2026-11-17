import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, IdCard, Pencil, TriangleAlert } from "lucide-react";
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
import { entityTypeFromPan } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { readPanRecord, savePanReviewPath } from "./verificationRecords";

const ENTITY_LABELS = {
  PROPRIETORSHIP: "Proprietorship",
  PARTNERSHIP: "Partnership / Firm",
  LLP: "LLP",
  PRIVATE_LIMITED: "Company",
  TRUST: "Trust",
  OTHERS: "Other",
};

/**
 * Screen 07r · PAN review — same layout as GST review. Continue saves names
 * → status → entity type (detected) → PAN on the backend right away.
 */
export default function PanReviewStep() {
  const { next, goTo } = useOnboardingFlow();
  const pan = useOnboardingV2Store((s) => s.form.pan);
  const panDetails = useOnboardingV2Store((s) => s.form.panDetails);
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Same as the production PAN step: the verified PAN is saved on the
  // backend as soon as the vendor confirms it.
  const handleContinue = useCallback(async () => {
    if (!panDetails || saving) return;
    try {
      setSaving(true);
      setError("");
      const result = await savePanReviewPath({ brandName, panDetails, pan });
      setField("legalName", result.legalName);
      setField("entityType", result.entityType);
      next();
    } catch (err) {
      console.error("PAN save failed:", err);
      setError(err?.message || "We couldn't save your PAN details. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [brandName, next, pan, panDetails, saving, setField]);

  const record = useMemo(() => readPanRecord(panDetails), [panDetails]);
  const items = useMemo(
    () => [
      { label: "Legal business name", value: record.name },
      { label: "PAN holder", value: record.holderType },
      { label: "PAN type", value: record.panType },
      { label: "Business structure", value: ENTITY_LABELS[entityTypeFromPan(record.pan || pan)] || null },
      { label: record.holderType === "Individual" ? "Date of birth" : "Date of incorporation", value: record.dateOfIncorporation },
      { label: "PAN status", value: record.status },
      { label: "Aadhaar linked", value: record.aadhaarLinked },
      { label: "Registered business address", value: record.address, wide: true },
    ],
    [pan, record],
  );

  const changeDetails = useCallback(() => goTo(SCREENS.PAN_ENTER), [goTo]);

  return (
    <StepCard
      icon={IdCard}
      title="Business PAN verified"
      subtitle="Review your verified business details before continuing."
      headerAside={panDetails && <StatusPill icon={Check}>Verified · Active</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={changeDetails} disabled={saving}>
              Change details
            </Button>
          }
        >
          <Button onClick={handleContinue} disabled={!panDetails} loading={saving} icon={ChevronRight}>
            {saving ? "Saving…" : "Continue to Business entity"}
          </Button>
        </StepFooter>
      }
    >
      {panDetails ? (
        <>
          <VerifiedHeroCard label="Business PAN" value={record.pan || pan} />
          <DetailGrid items={items} hideEmpty />
          <Notice tone="warning" icon={TriangleAlert}>
            Please confirm these details match your business PAN records before continuing.
          </Notice>
        </>
      ) : (
        <Notice tone="warning" icon={TriangleAlert}>
          We don&apos;t have verified PAN details yet. Use &ldquo;Change details&rdquo; to enter and verify your business PAN.
        </Notice>
      )}

      <FormError message={error} />
    </StepCard>
  );
}
