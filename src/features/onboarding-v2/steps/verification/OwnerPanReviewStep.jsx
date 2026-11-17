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
import { saveVerifiedGst, saveVerifiedPan } from "../../services/onboardingApi";
import { saveOwnerKyc } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { readPanRecord } from "./verificationRecords";

/**
 * PAN verification · details (GST and registered-no-GST paths). Same layout
 * as GST / business PAN review; Continue saves the verified PAN details
 * (POST /brands/onboarding/add-pan-details), like the production PAN step.
 */
export default function OwnerPanReviewStep() {
  const { next, goTo } = useOnboardingFlow();
  const ownerKyc = useOnboardingV2Store((s) => s.form.ownerKyc);
  const gstDetails = useOnboardingV2Store((s) => s.form.gstDetails);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const record = useMemo(() => readPanRecord(ownerKyc.panDetails), [ownerKyc.panDetails]);
  const items = useMemo(
    () => [
      { label: "Name on PAN", value: record.name || ownerKyc.panName },
      { label: "PAN holder", value: record.holderType },
      { label: "PAN type", value: record.panType },
      { label: record.holderType === "Individual" ? "Date of birth" : "Date of incorporation", value: record.dateOfIncorporation },
      { label: "Gender", value: record.gender },
      { label: "PAN status", value: record.status },
      { label: "Aadhaar linked", value: record.aadhaarLinked },
      { label: "Registered address", value: record.address, wide: true },
    ],
    [ownerKyc.panName, record],
  );

  const changeDetails = useCallback(() => goTo(SCREENS.OWNER_PAN), [goTo]);

  const handleSave = useCallback(async () => {
    if (!ownerKyc.panDetails || saving) return;
    try {
      setSaving(true);
      setError("");
      await saveVerifiedPan(ownerKyc.panDetails);
      // The PAN save moves the backend's onboarding screen back to GST; GST
      // was already saved, so re-send it to move forward again.
      if (gstDetails) await saveVerifiedGst(gstDetails);
      await saveOwnerKyc({ pan: ownerKyc.pan, panName: ownerKyc.panName });
      next();
    } catch (err) {
      console.error("Owner PAN save failed:", err);
      setError(err?.message || "We couldn't save your PAN details. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [gstDetails, next, ownerKyc.pan, ownerKyc.panDetails, ownerKyc.panName, saving]);

  return (
    <StepCard
      icon={IdCard}
      title="PAN verified"
      subtitle="Review your verified PAN details before continuing."
      headerAside={ownerKyc.panDetails && <StatusPill icon={Check}>Verified · Active</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={changeDetails} disabled={saving}>
              Change details
            </Button>
          }
        >
          <Button onClick={handleSave} disabled={!ownerKyc.panDetails} loading={saving} icon={ChevronRight}>
            {saving ? "Saving…" : "Continue to Business entity"}
          </Button>
        </StepFooter>
      }
    >
      {ownerKyc.panDetails ? (
        <>
          <VerifiedHeroCard label="PAN" value={record.pan || ownerKyc.pan} />
          <DetailGrid items={items} hideEmpty />
          <Notice tone="warning" icon={TriangleAlert}>
            Please confirm these details match your PAN records before continuing. This name must match your bank account name.
          </Notice>
        </>
      ) : (
        <Notice tone="warning" icon={TriangleAlert}>
          We don&apos;t have verified PAN details yet. Use &ldquo;Change details&rdquo; to enter and verify the PAN.
        </Notice>
      )}

      <FormError message={error} />
    </StepCard>
  );
}
