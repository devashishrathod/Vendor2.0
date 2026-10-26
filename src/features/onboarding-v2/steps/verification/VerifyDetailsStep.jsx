import { ChevronRight, CircleCheck, Pencil, TriangleAlert } from "lucide-react";
import Button from "../../components/ui/Button";
import DetailGrid from "../../components/ui/DetailGrid";
import Notice from "../../components/ui/Notice";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import VerifiedHeroCard from "../../components/ui/VerifiedHeroCard";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { useOnboardingV2Store } from "../../store/onboardingStore";

/**
 * Read-only "verified" review screen (PAN, GST, bank) driven by a config's
 * `review` block — see pan.config.js / gst.config.js / bank.config.js.
 * @param {{ config: { review: typeof import('./pan.config').panConfig.review } }} props
 */
export default function VerifyDetailsStep({ config }) {
  const { next, goTo } = useOnboardingFlow();
  const form = useOnboardingV2Store((s) => s.form);
  const { review } = config;

  return (
    <StepCard
      title={review.title}
      subtitle={review.subtitle}
      headerAside={<StatusPill icon={CircleCheck}>{review.badge}</StatusPill>}
      footer={
        <StepFooter
          startLastOnMobile
          start={
            <Button variant="ghost" icon={Pencil} iconPosition="start" onClick={() => goTo(review.editScreen)}>
              Change details
            </Button>
          }
        >
          <Button onClick={next} icon={ChevronRight}>
            {review.continueLabel}
          </Button>
        </StepFooter>
      }
    >
      <VerifiedHeroCard
        icon={review.heroIcon}
        label={review.heroLabel(form)}
        value={review.heroValue(form)}
        aside={review.heroAside(form)}
      />
      <DetailGrid items={review.details(form)} columns={review.columns} />
      <Notice tone="warning" icon={TriangleAlert}>
        {review.notice}
      </Notice>
    </StepCard>
  );
}
