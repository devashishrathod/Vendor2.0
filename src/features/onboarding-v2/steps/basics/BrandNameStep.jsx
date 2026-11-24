import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Building2, Info, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { SCREENS } from "../../config/screens";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBasicDetails } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { allPassed, brandNameLimits, brandNameRules } from "../../validation/rules";

/**
 * BRAND_NAME (guide §4.1). Only the customer-facing brand name — the legal
 * name comes from GST / PAN / owner verification on the server. Saves
 * `add-basic-details { step: BRAND_NAME, brandName }`; the response's
 * `currentScreen` is next. Length limits come from `status.limits`.
 */
export default function BrandNameStep() {
  const { limits, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand } = useSavedBrand();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);

  // null = untouched, so the saved name shows once the brand loads.
  const [draft, setDraft] = useState(null);
  const brandName = draft ?? brand?.brandName ?? "";
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nameLimits = useMemo(() => brandNameLimits(limits), [limits]);
  const rules = useMemo(() => brandNameRules(brandName, nameLimits), [brandName, nameLimits]);
  const isValid = allPassed(rules);
  const showError = touched && brandName.trim().length > 0 && !isValid;

  const handleChange = useCallback((event) => {
    setDraft(event.target.value);
    setError("");
  }, []);
  const handleBlur = useCallback(() => setTouched(true), []);

  const handleContinue = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isValid || saving) return;
      try {
        setSaving(true);
        setError("");
        const res = await addBasicDetails(SCREENS.BRAND_NAME, { brandName: brandName.trim() });
        mergeBrand(res?.data?.brand);
        goToServerScreen(res?.data?.currentScreen);
      } catch (err) {
        if (handleFlowError(err)) return;
        console.error("Brand name save failed:", err);
        setError(onboardingErrorMessage(err, "Couldn't save your brand name. Please try again."));
      } finally {
        setSaving(false);
      }
    },
    [brandName, goToServerScreen, handleFlowError, isValid, mergeBrand, saving],
  );

  return (
    <form onSubmit={handleContinue} noValidate>
      <StepCard
        icon={Building2}
        title="What should customers call you?"
        subtitle="Just your brand name for now. Your legal name is filled in automatically from GST or PAN later, so no typos."
        footer={
          <StepFooter start={<FormError message={error} />}>
            <Button type="submit" disabled={!isValid} loading={saving} icon={ArrowRight}>
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
              maxLength={nameLimits.max ?? undefined}
              value={brandName}
              onChange={handleChange}
              onBlur={handleBlur}
              valid={isValid}
              error={showError ? rules.find((r) => !r.passed)?.label : undefined}
              counter={nameLimits.max ? `${brandName.trim().length} / ${nameLimits.max}` : undefined}
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
