import { useMemo } from "react";
import { ArrowRight, Building2, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Notice from "../../components/ui/Notice";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { NAME_LIMITS } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed, businessNameRules } from "../../validation/rules";

export default function BusinessNameStep() {
  const { next } = useOnboardingFlow();
  const legalName = useOnboardingV2Store((s) => s.form.legalName);
  const brandName = useOnboardingV2Store((s) => s.form.brandName);
  const setField = useOnboardingV2Store((s) => s.setField);

  const rules = useMemo(() => businessNameRules(legalName, brandName), [legalName, brandName]);
  const isValid = allPassed(rules);

  return (
    <StepCard
      icon={Building2}
      title="Tell us your business name"
      subtitle="Your legal name goes on invoices. Your brand name is what customers see."
      footer={
        <StepFooter>
          <Button onClick={next} disabled={!isValid} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TextField
            id="legal-name"
            label="Legal business name"
            required
            hint="Exactly as on your registration or PAN"
            placeholder="e.g., Kentucky Fried Chicken"
            value={legalName}
            maxLength={NAME_LIMITS.legalMax}
            autoComplete="organization"
            onChange={(e) => setField("legalName", e.target.value)}
            counter={`${legalName.length} / ${NAME_LIMITS.legalMax}`}
          />
          <TextField
            id="brand-name"
            label="Brand name"
            required
            hint="Short name shown to customers"
            placeholder="e.g., KFC"
            value={brandName}
            maxLength={NAME_LIMITS.brandMax}
            onChange={(e) => setField("brandName", e.target.value)}
            counter={`${brandName.length} / ${NAME_LIMITS.brandMax}`}
          />
        </div>
        <RuleChecklist title="Name requirements" rules={rules} active={Boolean(legalName || brandName)} />
      </div>

      <Notice icon={Lock}>Both names are locked after approval. Changes then go through support.</Notice>
    </StepCard>
  );
}
