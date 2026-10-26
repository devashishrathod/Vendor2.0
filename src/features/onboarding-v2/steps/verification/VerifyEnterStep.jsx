import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import RuleChecklist from "../../components/ui/RuleChecklist";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { TextField } from "../../components/ui/TextField";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";
import { allPassed } from "../../validation/rules";

/**
 * Single-ID verification screen (PAN, GST) driven by a config — see
 * pan.config.js / gst.config.js.
 * @param {{ config: typeof import('./pan.config').panConfig }} props
 */
export default function VerifyEnterStep({ config }) {
  const { next, skip, isCompleted } = useOnboardingFlow();
  const value = useOnboardingV2Store((s) => s.form[config.field]);
  const pan = useOnboardingV2Store((s) => s.form.pan);
  const setField = useOnboardingV2Store((s) => s.setField);
  const { enter } = config;

  const rules = useMemo(() => config.rules(value, { pan }), [config, value, pan]);
  const isValid = allPassed(rules);
  const headerBadge = enter.headerBadge({ isCompleted });

  return (
    <StepCard
      icon={enter.icon}
      title={enter.title}
      subtitle={enter.subtitle}
      headerAside={
        headerBadge && (
          <StatusPill tone={headerBadge.tone} icon={headerBadge.icon}>
            {headerBadge.label}
          </StatusPill>
        )
      }
      footer={
        <StepFooter
          start={
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{enter.previewTitle}</p>
              {isValid ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold tracking-[0.12em] text-gray-900 dark:text-gray-100">
                  {value}
                  <StatusPill>✓ Valid format</StatusPill>
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">{enter.previewEmpty}</p>
              )}
            </div>
          }
        >
          <Button variant="secondary" onClick={skip}>
            Skip for now
          </Button>
          <Button onClick={next} disabled={!isValid} icon={ArrowRight}>
            Verify &amp; fetch details
          </Button>
        </StepFooter>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id={`${config.field}-input`}
          label={enter.label}
          required
          hint={enter.hint}
          placeholder={enter.placeholder}
          value={value}
          maxLength={config.maxLength}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(e) => setField(config.field, config.normalize(e.target.value))}
          counter={`${value.length} / ${config.maxLength}`}
          inputClassName="font-bold tracking-[0.14em] placeholder:tracking-normal"
        />
        <RuleChecklist title={enter.rulesTitle} rules={rules} active={value.length > 0} />
      </div>

      <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Before you continue</p>
        <ul className="mt-1.5 grid grid-cols-1 gap-1.5 text-[11.5px] text-gray-700 sm:grid-cols-3 sm:gap-2.5 dark:text-gray-300">
          {enter.tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      </div>
    </StepCard>
  );
}
