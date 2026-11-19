import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, ReceiptText } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { verifyGst } from "../../services/onboardingApi";
import { useVerifyStore } from "../../store/verifyStore";
import { allPassed, gstRules, toUpperAlphanumeric } from "../../validation/rules";
import { BeforeContinuePanel, FooterSummary } from "./VerificationParts";
import { CODE_INPUT_CLASS, gstErrorMessage, readGstRecord } from "./verificationRecords";

const GSTIN_LENGTH = 15;

const BEFORE_CONTINUE = [
  "Legal name, PAN and business type come from GST.",
  "The first two digits are your state.",
  "GST status must be Active.",
];

const NOT_ACTIVE_MESSAGE =
  "This GSTIN isn't active. If you don't have an active GST, go back and choose “Registered, no GST”.";

/**
 * GST_VERIFICATION · enter sub-step (guide §4.4). "Verify" makes ONE paid
 * verify-gst call (never retried; a GSTIN already verified this session is not
 * sent again). A failed check comes back 200 with `isVerified: false` and the
 * provider's message.
 * @param {{ onVerified: (result: object) => void }} props
 */
export default function GstEnterStep({ onVerified }) {
  const { handleFlowError } = useOnboardingFlow();
  const previous = useVerifyStore((s) => s.results.GST);
  const setResult = useVerifyStore((s) => s.setResult);

  const [gstin, setGstin] = useState(previous?.details?.gstNumber ?? "");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => gstRules(gstin), [gstin]);
  const isValid = allPassed(rules);
  const sameAsPrevious = Boolean(previous?.isVerified && previous?.details?.gstNumber === gstin);
  const previousRecord = useMemo(() => (sameAsPrevious ? readGstRecord(previous) : null), [previous, sameAsPrevious]);

  const handleChange = useCallback((event) => {
    setGstin(toUpperAlphanumeric(event.target.value, GSTIN_LENGTH));
    setError("");
  }, []);

  const handleVerify = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isValid || verifying) return;
      // Already verified this GSTIN in this session — don't pay for it again.
      if (sameAsPrevious) {
        if (previous.isActive === false) setError(NOT_ACTIVE_MESSAGE);
        else onVerified(previous);
        return;
      }
      try {
        setVerifying(true);
        setError("");
        const res = await verifyGst(gstin);
        const result = res?.data;
        if (!result?.isVerified) {
          setError(result?.message || "We couldn't verify this GSTIN. Check the number and try again.");
          return;
        }
        setResult("GST", result);
        if (result.isActive === false) {
          setError(NOT_ACTIVE_MESSAGE);
          return;
        }
        onVerified(result);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error("GST verification failed:", err);
        // DOCUMENT_IN_USE, PAN_NOT_IN_GSTIN (details.panOnBrand), BILLING_STATE_GSTIN_MISMATCH …
        setError(gstErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    },
    [gstin, handleFlowError, isValid, onVerified, previous, sameAsPrevious, setResult, verifying],
  );

  return (
    <form onSubmit={handleVerify} noValidate>
      <StepCard
        icon={ReceiptText}
        title="Enter your GSTIN"
        subtitle="One number fills your legal name, PAN, business type and address."
        footer={
          <StepFooter
            start={
              <FooterSummary label="GST registration details">
                {previousRecord?.legalName ? (
                  <span className="flex flex-wrap items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                    <Check size={14} strokeWidth={3} className="text-emerald-600" aria-hidden="true" />
                    {previousRecord.legalName}
                  </span>
                ) : (
                  "Your verified GST details will appear here."
                )}
              </FooterSummary>
            }
          >
            <Button type="submit" disabled={!isValid} loading={verifying} icon={ArrowRight}>
              {verifying ? "Verifying…" : sameAsPrevious ? "Review details" : "Verify & fetch details"}
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
