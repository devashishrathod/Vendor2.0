import { useMemo, useState } from "react";
import { updateBasicDetails } from "@/features/onboarding/services/api/brand.api";
import { updateBrandGstDetails } from "@/features/brand/services/gstPanApi";
import Button from "@/features/onboarding-v2/components/ui/Button";
import DetailGrid from "@/features/onboarding-v2/components/ui/DetailGrid";
import FormError from "@/features/onboarding-v2/components/ui/FormError";
import { TextField } from "@/features/onboarding-v2/components/ui/TextField";
import { fetchGstDetails } from "@/features/onboarding-v2/services/onboardingApi";
import {
  CODE_INPUT_CLASS,
  gstErrorMessage,
  isGstActive,
  readGstRecord,
} from "@/features/onboarding-v2/steps/verification/verificationRecords";
import { allPassed, gstRules, toUpperAlphanumeric } from "@/features/onboarding-v2/validation/rules";
import { isPickableEntity, isSavableLegalName } from "./correctionHelpers";

const GSTIN_LENGTH = 15;

/**
 * GSTIN re-verify for a rejected brand (GST path only), like the wizard's
 * GSTIN + GST review screens: only an Active GSTIN is accepted. Saving
 * stores the GST record (without moving the onboarding screen) and, like
 * the wizard, takes the legal name and business type from it.
 * @param {{
 *   initialGstin: string,
 *   onSaved: (result: { gstin: string, legalName: string|null, entityType: string|null }) => void,
 * }} props
 */
export default function GstCorrection({ initialGstin, onSaved }) {
  const [gstin, setGstin] = useState(initialGstin || "");
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const valid = allPassed(useMemo(() => gstRules(gstin), [gstin]));
  const record = useMemo(() => (details ? readGstRecord(details) : null), [details]);

  const verify = async () => {
    if (!valid || busy) return;
    setBusy("verify");
    setError("");
    try {
      const result = await fetchGstDetails(gstin);
      if (!isGstActive(result)) {
        const status = readGstRecord(result).registrationStatus;
        setError(`This GST registration is ${status ? status.toLowerCase() : "not active"}. Only an Active GSTIN can be used.`);
        return;
      }
      setDetails(result);
    } catch (err) {
      setError(gstErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!details || busy) return;
    setBusy("save");
    setError("");
    try {
      await updateBrandGstDetails(details);
      const legalName = record.legalName || record.tradeName || "";
      // The server's suggestion from the GST constitution (verify-gst `suggestedEntity`).
      const entity = details.suggestedEntity ?? null;
      const entityType = isPickableEntity(entity) ? entity : null;
      const basics = {
        ...(isSavableLegalName(legalName) ? { legalBusinessName: legalName } : {}),
        ...(entityType ? { businessEntityType: entityType } : {}),
      };
      if (Object.keys(basics).length) await updateBasicDetails(basics);
      setSaved(true);
      onSaved({ gstin, legalName: isSavableLegalName(legalName) ? legalName : null, entityType });
    } catch (err) {
      setError(err?.message || "Couldn't save the GST details. Please try again.");
    } finally {
      setBusy("");
    }
  };

  if (!details) {
    return (
      <div className="flex flex-col gap-3">
        <TextField
          id="fix-gstin"
          label="GSTIN"
          value={gstin}
          onChange={(e) => {
            setGstin(toUpperAlphanumeric(e.target.value, GSTIN_LENGTH));
            setError("");
          }}
          maxLength={GSTIN_LENGTH}
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g., 22ABCDE1234F1Z5"
          inputClassName={CODE_INPUT_CLASS}
          valid={valid}
          error={error || undefined}
          counter={`${gstin.length} / ${GSTIN_LENGTH}`}
        />
        <div className="flex justify-end">
          <Button onClick={verify} disabled={!valid} loading={busy === "verify"}>
            {busy === "verify" ? "Verifying…" : "Verify GSTIN"}
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
          { label: "GSTIN", value: record.gstNumber || gstin, tone: "success" },
          { label: "Legal business name", value: record.legalName },
          { label: "Trade name", value: record.tradeName },
          { label: "Business structure", value: record.constitution },
          { label: "Status", value: record.registrationStatus },
          { label: "Registered address", value: record.address, wide: true },
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
          {saved ? "Saved" : busy === "save" ? "Saving…" : "Save GST"}
        </Button>
      </div>
    </div>
  );
}
