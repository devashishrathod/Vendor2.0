import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, IdCard } from "lucide-react";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { ONBOARDING_ERROR_CODES } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { verifyPan } from "../../services/onboardingApi";
import { useVerifyStore } from "../../store/verifyStore";
import { allPassed, panRules, toUpperAlphanumeric } from "../../validation/rules";
import { BeforeContinuePanel, FooterSummary } from "./VerificationParts";
import { CODE_INPUT_CLASS, panErrorMessage } from "./verificationRecords";

const PAN_LENGTH = 10;

/**
 * PAN verify sub-step — business PAN (PAN_VERIFICATION) or the owner's PAN
 * (OWNER_VERIFICATION, `kind: "OWNER_PAN"`). "Verify" makes ONE paid
 * verify-pan call; a PAN already verified this session isn't sent again.
 * Path rules are checked by the server before paying: GST path
 * `PAN_NOT_IN_GSTIN` (refills `details.panFromGstin`), unregistered path
 * `OWNER_PAN_NOT_PERSONAL`.
 * @param {{
 *   kind?: 'PAN'|'OWNER_PAN', prefill?: string, title: string, subtitle: string,
 *   label: string, hint: string, note?: string, beforeContinue: string[],
 *   onVerified: (result: object) => void,
 * }} props
 */
export default function PanEnterStep({ kind = "PAN", prefill = "", title, subtitle, label, hint, note, beforeContinue, onVerified }) {
  const { handleFlowError } = useOnboardingFlow();
  const previous = useVerifyStore((s) => s.results[kind]);
  const setResult = useVerifyStore((s) => s.setResult);

  const [pan, setPan] = useState(previous?.details?.pan || prefill || "");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => panRules(pan), [pan]);
  const isValid = allPassed(rules);
  const sameAsPrevious = Boolean(previous?.isVerified && previous?.details?.pan === pan);

  const handleChange = useCallback((event) => {
    setPan(toUpperAlphanumeric(event.target.value, PAN_LENGTH));
    setError("");
  }, []);

  const handleVerify = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isValid || verifying) return;
      if (sameAsPrevious) {
        onVerified(previous);
        return;
      }
      try {
        setVerifying(true);
        setError("");
        const res = await verifyPan(pan);
        const result = res?.data;
        if (!result?.isVerified) {
          setError(result?.message || "We couldn't verify this PAN. Check the number and try again.");
          return;
        }
        setResult(kind, result);
        onVerified(result);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error("PAN verification failed:", err);
        // GST path: the PAN must be the one inside the GSTIN — put it back.
        const fromGstin = getErrorDetails(err)?.panFromGstin;
        if (getErrorCode(err) === ONBOARDING_ERROR_CODES.PAN_NOT_IN_GSTIN && fromGstin) setPan(fromGstin);
        setError(panErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    },
    [handleFlowError, isValid, kind, onVerified, pan, previous, sameAsPrevious, setResult, verifying],
  );

  return (
    <form onSubmit={handleVerify} noValidate>
      <StepCard
        icon={IdCard}
        title={title}
        subtitle={subtitle}
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
                      {sameAsPrevious ? "Verified" : "Valid format"}
                    </span>
                  </span>
                ) : (
                  "Enter a valid PAN to continue."
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
            id={`${kind.toLowerCase()}-input`}
            label={label}
            required
            hint={hint}
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
          <RuleChecklist title="PAN requirements" rules={rules} active={pan.length > 0} note={note} />
        </div>

        <BeforeContinuePanel items={beforeContinue} />

        <FormError message={error} />
      </StepCard>
    </form>
  );
}
