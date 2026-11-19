import { useMemo, useState } from "react";
import { updateBasicDetails } from "@/features/onboarding/services/api/brand.api";
import { updateBrandPanDetails } from "@/features/brand/services/gstPanApi";
import Button from "@/features/onboarding-v2/components/ui/Button";
import DetailGrid from "@/features/onboarding-v2/components/ui/DetailGrid";
import FormError from "@/features/onboarding-v2/components/ui/FormError";
import { TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { BRANCHES } from "@/features/onboarding-v2/config/onboardingFlow";
import { entityTypeFromPan, fetchPanDetails } from "@/features/onboarding-v2/services/onboardingApi";
import {
  CODE_INPUT_CLASS,
  panErrorMessage,
  readPanRecord,
} from "@/features/onboarding-v2/steps/verification/verificationRecords";
import { allPassed, PAN_ACCEPTED_NOTE, panRules, toUpperAlphanumeric } from "@/features/onboarding-v2/validation/rules";
import { isPickableEntity, isSavableLegalName } from "./correctionHelpers";

const PAN_LENGTH = 10;

/**
 * PAN re-verify for a rejected brand. Like the wizard, on the paths without
 * GST the name on the PAN becomes the legal business name (on the GST path
 * the GST registration decides it). Saving stores the PAN record without
 * moving the onboarding screen.
 * @param {{
 *   brandId: string, branch: string, initialPan: string,
 *   onSaved: (result: { legalName: string|null, suggestedEntity: string|null }) => void,
 * }} props
 */
export default function PanCorrection({ brandId, branch, initialPan, onSaved }) {
  const [pan, setPan] = useState(initialPan || "");
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const valid = allPassed(useMemo(() => panRules(pan), [pan]));
  const record = useMemo(() => (details ? readPanRecord(details) : null), [details]);
  const nameIsLegalName = branch !== BRANCHES.GST;

  const verify = async () => {
    if (!valid || busy) return;
    setBusy("verify");
    setError("");
    try {
      const result = await fetchPanDetails(pan);
      if (!readPanRecord(result).name) throw new Error("We couldn't read the name on this PAN. Check the number and try again.");
      setDetails(result);
    } catch (err) {
      setError(panErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!details || busy) return;
    setBusy("save");
    setError("");
    try {
      await updateBrandPanDetails(brandId, details);
      const legalName = nameIsLegalName && isSavableLegalName(record.name) ? record.name : null;
      if (legalName) await updateBasicDetails({ legalBusinessName: legalName });
      const fromPan = branch === BRANCHES.REG_NO_GST ? entityTypeFromPan(record.pan || pan) : null;
      setSaved(true);
      onSaved({ legalName, suggestedEntity: isPickableEntity(fromPan) ? fromPan : null });
    } catch (err) {
      setError(err?.message || "Couldn't save the PAN details. Please try again.");
    } finally {
      setBusy("");
    }
  };

  if (!details) {
    return (
      <div className="flex flex-col gap-3">
        <TextField
          id="fix-pan"
          label={branch === BRANCHES.UNREGISTERED ? "Owner PAN" : "Business PAN"}
          hint={PAN_ACCEPTED_NOTE}
          value={pan}
          onChange={(e) => {
            setPan(toUpperAlphanumeric(e.target.value, PAN_LENGTH));
            setError("");
          }}
          maxLength={PAN_LENGTH}
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g., ABCDE1234F"
          inputClassName={CODE_INPUT_CLASS}
          valid={valid}
          error={error || undefined}
          counter={`${pan.length} / ${PAN_LENGTH}`}
        />
        <div className="flex justify-end">
          <Button onClick={verify} disabled={!valid} loading={busy === "verify"}>
            {busy === "verify" ? "Verifying…" : "Verify PAN"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <DetailGrid
        hideEmpty
        items={[
          { label: "PAN", value: record.pan || pan, tone: "success" },
          { label: nameIsLegalName ? "Legal business name" : "Name on PAN", value: record.name },
          { label: "PAN type", value: record.panType || record.holderType },
          { label: record.holderType === "Individual" ? "Date of birth" : "Date of incorporation", value: record.dateOfIncorporation },
          { label: "PAN status", value: record.status },
        ]}
      />
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setDetails(null);
            setSaved(false);
          }}
          disabled={Boolean(busy)}
        >
          Change
        </Button>
        <Button onClick={save} disabled={saved} loading={busy === "save"}>
          {saved ? "Saved" : busy === "save" ? "Saving…" : "Save PAN"}
        </Button>
      </div>
    </div>
  );
}
