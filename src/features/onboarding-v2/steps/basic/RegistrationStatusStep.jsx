import { useState } from "react";
import { ArrowRight, Building2, Check, FileText, Info, Store } from "lucide-react";
import Button from "../../components/ui/Button";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { BRANCHES } from "../../config/onboardingFlow";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";

const OPTIONS = [
  {
    value: BRANCHES.REGISTERED,
    icon: Building2,
    title: "Registered business",
    description: "You have GST or a company / firm registration.",
    badge: { tone: "success", label: "Recommended" },
    nextItems: ["Business type", "PAN and GST (verified instantly)", "Business documents for your category"],
  },
  {
    value: BRANCHES.UNREGISTERED,
    icon: Store,
    title: "Unregistered business",
    description: "No GST yet. A small shop, home business or new venture.",
    badge: { tone: "neutral", label: "No GST needed" },
    nextItems: ["Business documents, as many as you have", "Owner ID, business licence, shop proof", "Each one with a title"],
  },
];

export default function RegistrationStatusStep() {
  const { chooseBranch } = useOnboardingFlow();
  const branch = useOnboardingV2Store((s) => s.branch);
  // Saved to the store on Continue, so the sidebar doesn't switch paths
  // while the vendor is still deciding.
  const [choice, setChoice] = useState(branch);

  const handleContinue = () => chooseBranch(choice);

  return (
    <StepCard
      icon={FileText}
      title="Is your business registered?"
      subtitle="This decides which documents we ask for next. Both options can sell on Trydood."
      footer={
        <StepFooter>
          <Button onClick={handleContinue} disabled={!choice} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = choice === option.value;
          return (
            <OptionCard
              key={option.value}
              icon={option.icon}
              title={option.title}
              description={option.description}
              selected={selected}
              onSelect={() => setChoice(option.value)}
              badge={<StatusPill tone={option.badge.tone}>{option.badge.label}</StatusPill>}
            >
              <span
                className={`block w-full border-t pt-2.5 ${selected ? "border-emerald-200 dark:border-emerald-500/30" : "border-gray-100 dark:border-gray-800"}`}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Next you'll add</span>
                <span className="mt-1.5 flex flex-col gap-1">
                  {option.nextItems.map((item) => (
                    <span key={item} className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                      <Check size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </span>
              </span>
            </OptionCard>
          );
        })}
      </div>

      <Notice icon={Info}>Picked the wrong one? You can come back and change it before you submit for review.</Notice>
    </StepCard>
  );
}
