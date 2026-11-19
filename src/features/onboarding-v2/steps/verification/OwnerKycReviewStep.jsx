import { useCallback, useMemo, useState } from "react";
import { Check, ChevronRight, Pencil, TriangleAlert, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { BRANCHES, SCREENS } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { saveBusinessNames, saveBusinessStatus } from "../../services/onboardingApi";
import { saveOwnerKyc } from "../../services/pendingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { readOwnerIdentity, readPanRecord } from "./verificationRecords";

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{children}</p>;
}

/**
 * Screen 08u-r · Owner review — "Not registered" path, after Owner
 * verification. Same layout as GST / PAN review: the verified owner PAN and
 * identity, "Change details" back to the owner screen, and Continue saves
 * them — names (the owner's PAN name becomes the legal name) → business
 * status → owner KYC.
 */
export default function OwnerKycReviewStep() {
  const { next, goTo } = useOnboardingFlow();
  const ownerKyc = useOnboardingV2Store((s) => s.form.ownerKyc);
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const record = useMemo(() => readPanRecord(ownerKyc.panDetails), [ownerKyc.panDetails]);
  const isDigiLocker = ownerKyc.idMethod !== "upload";
  const identityDone = isDigiLocker ? ownerKyc.idVerified : Boolean(ownerKyc.idType && ownerKyc.idFileName);
  const ready = Boolean(ownerKyc.panDetails && ownerKyc.panName) && identityDone;

  const panItems = useMemo(
    () => [
      { label: "Legal business name", value: ownerKyc.panName || record.name, tone: "success" },
      { label: "PAN holder", value: record.holderType },
      { label: "PAN type", value: record.panType },
      { label: record.holderType === "Individual" ? "Date of birth" : "Date of incorporation", value: record.dateOfIncorporation },
      { label: "PAN status", value: record.status },
      { label: "Aadhaar linked", value: record.aadhaarLinked },
      { label: "Address", value: record.address, wide: true },
    ],
    [ownerKyc.panName, record],
  );

  const identityItems = useMemo(() => {
    const identity = readOwnerIdentity(ownerKyc);
    return [
      { label: "Identity", value: identity.method, tone: "success" },
      { label: identity.detailLabel, value: identity.detail },
    ];
  }, [ownerKyc]);

  const handleContinue = useCallback(async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveBusinessNames({ legalName: ownerKyc.panName, brandName });
      await saveBusinessStatus(BRANCHES.UNREGISTERED);
      await saveOwnerKyc({
        pan: ownerKyc.pan,
        panName: ownerKyc.panName,
        idMethod: ownerKyc.idMethod,
        idType: isDigiLocker ? undefined : ownerKyc.idType,
      });
      setField("legalName", ownerKyc.panName);
      next();
    } catch (err) {
      console.error("Owner KYC save failed:", err);
      setError(err?.message || "We couldn't save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [brandName, isDigiLocker, next, ownerKyc, ready, saving, setField]);

  const changeDetails = useCallback(() => goTo(SCREENS.OWNER_KYC), [goTo]);

  return (
    <StepCard
      icon={UserRound}
      title="Owner verified"
      subtitle="Review the owner's verified details before continuing."
      headerAside={ready && <StatusPill icon={Check}>Verified</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={changeDetails} disabled={saving}>
              Change details
            </Button>
          }
        >
          <Button onClick={handleContinue} disabled={!ready} loading={saving} icon={ChevronRight}>
            {saving ? "Saving…" : "Continue to Business entity"}
          </Button>
        </StepFooter>
      }
    >
      {ready ? (
        <>
          <VerifiedHeroCard
            label="Owner PAN"
            value={record.pan || ownerKyc.pan}
            aside={{ label: "Name on PAN", value: ownerKyc.panName }}
          />

          <div className="flex flex-col gap-2.5">
            <SectionLabel>PAN details</SectionLabel>
            <DetailGrid items={panItems} hideEmpty />
          </div>

          <div className="flex flex-col gap-2.5">
            <SectionLabel>Identity</SectionLabel>
            <DetailGrid items={identityItems} hideEmpty />
          </div>

          <Notice tone="warning" icon={TriangleAlert}>
            Please confirm these details before continuing. The name on this PAN becomes your business&apos;s legal name and must
            match your bank account name.
          </Notice>
        </>
      ) : (
        <Notice tone="warning" icon={TriangleAlert}>
          We don&apos;t have the owner&apos;s verified PAN and identity yet. Use &ldquo;Change details&rdquo; to verify them.
        </Notice>
      )}

      <FormError message={error} />
    </StepCard>
  );
}
