import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, IdCard } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { BRANCHES } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchPanDetails } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, PAN_ACCEPTED_NOTE, panRules, toUpperAlphanumeric } from "../../validation/rules";
import { BeforeContinuePanel, FooterSummary } from "./VerificationParts";
import { CODE_INPUT_CLASS, panErrorMessage, readPanRecord } from "./verificationRecords";

const PAN_LENGTH = 10;
const PERSONAL_PAN_LETTER = "P";

const BEFORE_CONTINUE = [
  "Enter the PAN of the owner, director or partner who signs.",
  "Their name must match the bank account name later.",
  "Verification is instant.",
];

/**
 * PAN verification (GST and registered-no-GST paths) — entry screen, same
 * pattern as GSTIN / business PAN: enter → "Verify & fetch details" → the
 * details screen that follows, where they're saved.
 */
export default function OwnerPanEnterStep() {
  const { next, branch } = useOnboardingFlow();
  const ownerKyc = useOnboardingV2Store((s) => s.form.ownerKyc);
  const businessPan = useOnboardingV2Store((s) => s.form.pan);
  const businessPanDetails = useOnboardingV2Store((s) => s.form.panDetails);
  const patchForm = useOnboardingV2Store((s) => s.patchForm);

  // A proprietorship's GSTIN carries the owner's own PAN (4th letter P).
  const prefilled = branch === BRANCHES.GST && businessPan?.charAt(3) === PERSONAL_PAN_LETTER ? businessPan : "";
  const [pan, setPan] = useState(ownerKyc.pan || prefilled);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => panRules(pan), [pan]);
  const isValid = allPassed(rules);

  const handleChange = useCallback((event) => {
    setPan(toUpperAlphanumeric(event.target.value, PAN_LENGTH));
    setError("");
  }, []);

  const handleVerify = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isValid || verifying) return;
      // The lookup is paid: reuse a record we already hold for this PAN —
      // this screen's earlier result, or the business PAN fetched with the GSTIN.
      if (pan === ownerKyc.pan && ownerKyc.panDetails) {
        next();
        return;
      }
      try {
        setVerifying(true);
        setError("");
        const panDetails = pan === businessPan && businessPanDetails ? businessPanDetails : await fetchPanDetails(pan);
        const name = readPanRecord(panDetails).name;
        if (!name) throw new Error("We couldn't read the name on this PAN. Check the number and try again.");
        patchForm("ownerKyc", { pan, panName: name, panDetails });
        next();
      } catch (err) {
        console.error("Owner PAN verification failed:", err);
        setError(panErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    },
    [businessPan, businessPanDetails, isValid, next, ownerKyc.pan, ownerKyc.panDetails, pan, patchForm, verifying],
  );

  return (
    <form onSubmit={handleVerify} noValidate>
      <StepCard
        icon={IdCard}
        title="Business PAN"
        subtitle="Enter the PAN of the owner, director or partner who signs for this business. We fetch the name on it."
        footer={
          <StepFooter
            start={
              <FooterSummary label="PAN details">
                {isValid ? (
                  <span className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 font-semibold ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                    <span className="text-gray-500">PAN</span>
                    <span className="font-bold tracking-[0.12em] text-gray-900 dark:text-gray-100">{pan}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                      Valid
                    </span>
                  </span>
                ) : (
                  "Your verified PAN details will appear on the next screen."
                )}
              </FooterSummary>
            }
          >
            <Button type="submit" disabled={!isValid} loading={verifying} icon={ArrowRight}>
              {verifying ? "Verifying…" : "Verify & fetch details"}
            </Button>
          </StepFooter>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            id="owner-pan"
            label="Owner PAN"
            required
            hint={prefilled ? "Prefilled from your GSTIN for a proprietorship" : "10 characters · 5 letters · 4 numbers · 1 letter"}
            placeholder="e.g., ABCDE1234F"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={PAN_LENGTH}
            value={pan}
            onChange={handleChange}
            valid={isValid}
            success={isValid ? "Valid PAN format" : undefined}
            counter={`${pan.length} / ${PAN_LENGTH}`}
            inputClassName={CODE_INPUT_CLASS}
          />
          <RuleChecklist title="PAN requirements" rules={rules} active={pan.length > 0} note={PAN_ACCEPTED_NOTE} />
        </div>

        <BeforeContinuePanel items={BEFORE_CONTINUE} />

        <FormError message={error} />
      </StepCard>
    </form>
  );
}
