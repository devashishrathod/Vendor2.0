import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, IdCard } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { fetchPanDetails } from "../../services/onboardingApi";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, PAN_ACCEPTED_NOTE, panRules, toUpperAlphanumeric } from "../../validation/rules";
import { BeforeContinuePanel, FooterSummary } from "./VerificationParts";
import { CODE_INPUT_CLASS, panErrorMessage } from "./verificationRecords";

const PAN_LENGTH = 10;

const BEFORE_CONTINUE = [
  "Enter your business PAN, or your personal PAN if you run it yourself.",
  "It should match your registration details.",
  "Verification is instant.",
];

/**
 * Screen 06r · Business PAN (registered, no GST). A personal PAN (4th
 * letter P) is accepted too — the business type then defaults to
 * Proprietorship.
 */
export default function PanEnterStep() {
  const { next } = useOnboardingFlow();
  const storedPan = useOnboardingV2Store((s) => s.form.pan);
  const setField = useOnboardingV2Store((s) => s.setField);

  const [pan, setPan] = useState(storedPan);
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
      try {
        setVerifying(true);
        setError("");
        const panDetails = await fetchPanDetails(pan);
        setField("pan", pan);
        setField("panDetails", panDetails);
        next();
      } catch (err) {
        console.error("PAN verification failed:", err);
        setError(panErrorMessage(err));
      } finally {
        setVerifying(false);
      }
    },
    [isValid, next, pan, setField, verifying],
  );

  return (
    <form onSubmit={handleVerify} noValidate>
      <StepCard
        icon={IdCard}
        title="Verify your business PAN"
        subtitle="For registered businesses without GST. We read your business type from the 4th letter and fetch your legal name."
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
                  "Enter a valid PAN to continue."
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
            id="business-pan"
            label="Business PAN"
            required
            hint="10 characters · 5 letters · 4 numbers · 1 letter"
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
