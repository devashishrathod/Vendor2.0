import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, ReceiptText } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchGstDetails, fetchPanDetails } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, gstRules, toUpperAlphanumeric } from "../../validation/rules";
import { BeforeContinuePanel, FooterSummary } from "./VerificationParts";
import { CODE_INPUT_CLASS, gstErrorMessage, isGstActive, readGstRecord } from "./verificationRecords";

const GSTIN_LENGTH = 15;

const BEFORE_CONTINUE = [
  "Legal name, PAN and business type come from GST.",
  "The first two digits are your state.",
  "GST status must be Active.",
];

/**
 * Screen 06 · GSTIN. Verifies the GSTIN and, alongside it, the PAN inside
 * it (characters 3–12). A failed PAN lookup doesn't block the GST path.
 */
export default function GstEnterStep() {
  const { next } = useOnboardingFlow();
  const storedGstin = useOnboardingV2Store((s) => s.form.gstin);
  const storedGstDetails = useOnboardingV2Store((s) => s.form.gstDetails);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [gstin, setGstin] = useState(storedGstin);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => gstRules(gstin), [gstin]);
  const isValid = allPassed(rules);
  const verifiedRecord = useMemo(
    () => (storedGstDetails && storedGstin === gstin ? readGstRecord(storedGstDetails) : null),
    [gstin, storedGstDetails, storedGstin],
  );

  const handleChange = useCallback((event) => {
    setGstin(toUpperAlphanumeric(event.target.value, GSTIN_LENGTH));
    setError("");
  }, []);

  const handleVerify = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isValid || verifying) return;
      // Same GSTIN already verified and active — the lookups are paid, don't repeat them.
      if (verifiedRecord && isGstActive(storedGstDetails)) {
        next();
        return;
      }
      const pan = gstin.slice(2, 12);
      try {
        setVerifying(true);
        setError("");
        const [gstResult, panResult] = await Promise.allSettled([fetchGstDetails(gstin), fetchPanDetails(pan)]);
        if (gstResult.status === "rejected") throw gstResult.reason;

        const gstDetails = gstResult.value;
        if (!isGstActive(gstDetails)) {
          const status = readGstRecord(gstDetails).registrationStatus;
          setError(
            `This GST registration is ${status ? status.toLowerCase() : "not active"}. Only an Active GSTIN can be used. If you have no active GST, go back and pick "Registered, no GST".`,
          );
          return;
        }
        if (panResult.status === "rejected") {
          console.error("PAN lookup during GST verification failed (not blocking):", panResult.reason);
        }

        setField("gstin", gstin);
        setField("gstDetails", gstDetails);
        setField("pan", pan);
        setField("panDetails", panResult.status === "fulfilled" ? panResult.value : null);
        next();
      } catch (err) {
        console.error("GST verification failed:", err);
        setError(gstErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    },
    [gstin, isValid, next, setField, storedGstDetails, verifiedRecord, verifying],
  );

  return (
    <form onSubmit={handleVerify} noValidate>
      <StepCard
        icon={ReceiptText}
        title="Enter your GSTIN"
        subtitle="One number fills your legal name, PAN, business type and address. No separate PAN step."
        footer={
          <StepFooter
            start={
              <FooterSummary label="GST registration details">
                {verifiedRecord?.legalName ? (
                  <span className="flex flex-wrap items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                    <Check size={14} strokeWidth={3} className="text-emerald-600" aria-hidden="true" />
                    {verifiedRecord.legalName}
                  </span>
                ) : (
                  "Your verified GST details will appear here."
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
            id="gstin"
            label="Business GSTIN"
            required
            hint="15 characters · includes your registered PAN"
            placeholder="e.g., 27ABCDE1234F1Z5"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={GSTIN_LENGTH}
            value={gstin}
            onChange={handleChange}
            valid={isValid}
            success={isValid ? "Valid GSTIN format" : undefined}
            counter={`${gstin.length} / ${GSTIN_LENGTH}`}
            inputClassName={CODE_INPUT_CLASS}
          />
          <RuleChecklist title="GSTIN requirements" rules={rules} active={gstin.length > 0} />
        </div>

        <BeforeContinuePanel items={BEFORE_CONTINUE} />

        <FormError message={error} />
      </StepCard>
    </form>
  );
}
