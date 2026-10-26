import { useState } from "react";
import { ArrowRight, ChevronDown, Users } from "lucide-react";
import Button from "../../components/ui/Button";
import OptionCard from "../../components/ui/OptionCard";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { SCREENS } from "../../config/onboardingFlow";
import { MORE_ENTITY_TYPES, PRIMARY_ENTITY_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";

export default function EntityTypeStep() {
  const { next, goTo } = useOnboardingFlow();
  const entityType = useOnboardingV2Store((s) => s.form.entityType);
  const setField = useOnboardingV2Store((s) => s.setField);

  const pickedMore = MORE_ENTITY_TYPES.find((t) => t.value === entityType);
  const [showMore, setShowMore] = useState(Boolean(pickedMore));

  return (
    <StepCard
      icon={Users}
      title="What type of business is it?"
      subtitle="Pick the legal structure on your registration. We match it with your PAN next."
      footer={
        <StepFooter>
          <Button onClick={next} disabled={!entityType} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {PRIMARY_ENTITY_TYPES.map((type) => (
          <OptionCard
            key={type.value}
            title={type.label}
            description={type.description}
            selected={entityType === type.value}
            onSelect={() => setField("entityType", type.value)}
          />
        ))}
        <button
          type="button"
          aria-expanded={showMore}
          aria-controls="more-entity-types"
          onClick={() => setShowMore((open) => !open)}
          className={`flex h-full flex-col gap-1 rounded-2xl p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            pickedMore ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10" : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-gray-900 dark:ring-gray-700"
          }`}
        >
          <span className="flex items-center justify-between text-[15px] font-extrabold text-gray-700 dark:text-gray-200">
            {pickedMore ? pickedMore.label : "More"}
            <ChevronDown size={14} strokeWidth={2.5} className={`text-gray-500 transition-transform ${showMore ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
          <span className="text-xs leading-snug text-gray-600 dark:text-gray-400">Public Ltd, OPC, Trust, NGO, Society, Others</span>
        </button>
      </div>

      {showMore && (
        <div id="more-entity-types" className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">More types</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {MORE_ENTITY_TYPES.map((type) => {
              const active = entityType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setField("entityType", type.value)}
                  className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Picked "registered" by mistake?{" "}
        <button
          type="button"
          onClick={() => goTo(SCREENS.REGISTRATION_STATUS)}
          className="font-bold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Go back and change it
        </button>
      </p>
    </StepCard>
  );
}
