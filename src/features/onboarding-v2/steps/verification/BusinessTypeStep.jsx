import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Briefcase, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Notice from "../../components/ui/Notice";
import FormError from "../../components/ui/FormError";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { BRANCHES } from "../../config/onboardingFlow";
import { ENTITY_VALUES, PRIMARY_ENTITY_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { detectEntityType, saveChangedEntityType } from "./verificationRecords";

// Business PAN 4th letter, in words, for the subtitle.
const PAN_LETTER_MEANING = {
  P: "personal PAN",
  C: "company",
  F: "firm",
  T: "trust",
  A: "association of persons",
  B: "body of individuals",
  H: "Hindu undivided family",
  G: "government",
  L: "local authority",
  J: "artificial juridical person",
};

function DetectedPill({ source, locked }) {
  if (locked) {
    return (
      <StatusPill icon={Lock} tone="neutral">
        From GST · locked
      </StatusPill>
    );
  }
  return <StatusPill>{source === "not registered" ? "Recommended" : `Recommended · from ${source}`}</StatusPill>;
}

/**
 * Business entity — on every path, pre-selected from the GST constitution
 * (GST), the business PAN's 4th letter (registered, no GST) or
 * Proprietorship (not registered). Registered paths already saved the
 * detected type on their review screen, so Continue only saves again when
 * the vendor changes it.
 */
export default function BusinessTypeStep() {
  const { next, branch } = useOnboardingFlow();
  const pan = useOnboardingV2Store((s) => s.form.pan);
  const panDetails = useOnboardingV2Store((s) => s.form.panDetails);
  const gstDetails = useOnboardingV2Store((s) => s.form.gstDetails);
  const ownerPanDetails = useOnboardingV2Store((s) => s.form.ownerKyc.panDetails);
  const ownerPan = useOnboardingV2Store((s) => s.form.ownerKyc.pan);
  const storedEntityType = useOnboardingV2Store((s) => s.form.entityType);
  const setField = useOnboardingV2Store((s) => s.setField);

  // The entity belongs to the business, so the business PAN (on the GST path,
  // the one inside the GSTIN) comes first; a director's or partner's own PAN
  // (4th letter P) would wrongly suggest a proprietorship.
  const entityPan = pan || ownerPan || "";
  const { entityType: detected, source } = useMemo(
    () => detectEntityType({ branch, gstDetails, pan: entityPan }),
    [branch, entityPan, gstDetails],
  );
  // GST path with a clear GST "constitution": the entity comes from the GST
  // registration and is view-only — the vendor can see it, not change it.
  const locked = branch === BRANCHES.GST && source === "GST" && Boolean(detected);
  // An older saved value outside the 5 options (e.g. OTHERS) counts as unset.
  const storedValid = ENTITY_VALUES.includes(storedEntityType) ? storedEntityType : null;
  const [picked, setSelected] = useState(storedValid ?? detected);
  const selected = locked ? detected : picked;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const panLetter = entityPan.charAt(3).toUpperCase();
  const isUnregistered = branch === BRANCHES.UNREGISTERED;
  const needsPan = branch === BRANCHES.REG_NO_GST;
  let subtitle = "Pick the type that matches your business registration.";
  if (locked) subtitle = "Taken from your GST registration. It can't be changed here because it must match your GST.";
  else if (source === "GST" && detected) subtitle = "We've selected the recommended type from your GST registration. Change it only if it looks wrong.";
  else if (isUnregistered) subtitle = "Most unregistered businesses are run by one owner, so we've recommended that. Change it if yours is different.";
  else if (source === "PAN" && detected && PAN_LETTER_MEANING[panLetter]) {
    subtitle = `We've selected the recommended type from your PAN (4th letter ${panLetter} = ${PAN_LETTER_MEANING[panLetter]}). Change it only if it looks wrong.`;
  }


  const handleSelect = useCallback(
    (value) => {
      if (locked) return;
      setSelected(value);
      setError("");
    },
    [locked],
  );

  const handleContinue = useCallback(async () => {
    if (!selected || (needsPan && !panDetails) || saving) return;
    // Registered paths saved the detected type on their review screen; only
    // a changed (or never-saved) type needs another save.
    if (selected === storedEntityType) {
      next();
      return;
    }
    try {
      setSaving(true);
      setError("");
      // On the GST path the owner PAN was the last PAN saved — re-send that one.
      const lastSavedPan = branch === BRANCHES.GST ? ownerPanDetails ?? panDetails : panDetails;
      await saveChangedEntityType({ branch, entityType: selected, panDetails: lastSavedPan, gstDetails });
      setField("entityType", selected);
      next();
    } catch (err) {
      console.error("Registered-no-GST save failed:", err);
      setError(err?.message || "We couldn't save your business details. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [branch, gstDetails, needsPan, next, ownerPanDetails, panDetails, saving, selected, setField, storedEntityType]);

  return (
    <StepCard
      icon={Briefcase}
      title="Your business entity"
      subtitle={subtitle}
      footer={
        <StepFooter>
          <Button onClick={handleContinue} disabled={!selected || (needsPan && !panDetails)} loading={saving} icon={ArrowRight}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        </StepFooter>
      }
    >
      <div role="group" aria-label="Business entity" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {PRIMARY_ENTITY_TYPES.map((type) => (
          <OptionCard
            key={type.value}
            title={type.label}
            description={type.description}
            selected={selected === type.value}
            onSelect={() => handleSelect(type.value)}
            disabled={locked && selected !== type.value}
            badge={detected === type.value ? <DetectedPill source={source} locked={locked} /> : null}
          />
        ))}
      </div>



      {locked && (
        <Notice icon={Lock}>
          Your business entity is read from your GST registration, so it can&apos;t be changed here. If it looks wrong, update it
          on the GST portal first, or contact support.
        </Notice>
      )}
      {needsPan && !panDetails && (
        <Notice tone="warning">Verify your business PAN first. Go back to the Business PAN step to do it.</Notice>
      )}
      <FormError message={error} />
    </StepCard>
  );
}
