import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Building2, Info, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Notice from "../../components/ui/Notice";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { NAME_LIMITS } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, brandNameRules } from "../../validation/rules";

/**
 * Screen 03 · Brand name. Only the customer-facing brand name is typed here;
 * the legal name comes from GST / PAN later.
 */
export default function BrandNameStep() {
  const { next } = useOnboardingFlow();
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const setField = useOnboardingV2Store((s) => s.setField);
  const [touched, setTouched] = useState(false);

  const rules = useMemo(() => brandNameRules(brandName), [brandName]);
  const isValid = allPassed(rules);
  const showError = touched && brandName.trim().length > 0 && !isValid;

  const handleChange = useCallback((event) => setField("brandName", event.target.value), [setField]);
  const handleBlur = useCallback(() => setTouched(true), []);

  const handleContinue = useCallback(
    (event) => {
      event.preventDefault();
      if (!isValid) return;
      setField("brandName", brandName.trim());
      next();
    },
    [brandName, isValid, next, setField],
  );

  return (
    <form onSubmit={handleContinue} noValidate>
      <StepCard
        icon={Building2}
        title="What should customers call you?"
        subtitle="Just your brand name for now. Your legal name is filled in automatically from GST or PAN later, so no typos."
        footer={
          <StepFooter>
            <Button type="submit" disabled={!isValid} icon={ArrowRight}>
              Continue
            </Button>
          </StepFooter>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <TextField
              id="brand-name"
              label="Brand name"
              required
              hint="Short name shown to customers"
              placeholder="e.g., KFC"
              autoComplete="organization"
              maxLength={NAME_LIMITS.brandMax}
              value={brandName}
              onChange={handleChange}
              onBlur={handleBlur}
              valid={isValid}
              error={showError ? "Use 2–15 letters. Spaces and & . ' - , ( ) are allowed." : undefined}
              counter={`${brandName.length} / ${NAME_LIMITS.brandMax}`}
            />
            <Notice tone="info" icon={Info} title="Legal name: no need to type it">
              We fetch it from your GSTIN or PAN in Verification. Unregistered? We use the owner&apos;s name from PAN.
            </Notice>
          </div>
          <RuleChecklist title="Name requirements" rules={rules} active={brandName.length > 0} />
        </div>

        <Notice icon={Lock}>Brand name is locked after approval. Changes then go through support.</Notice>
      </StepCard>
    </form>
  );
}
