import { useCallback, useState } from "react";
import { ArrowRight, Check, CircleHelp, Lock } from "lucide-react";
import { getErrorCode } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { KYC_PATHS, ONBOARDING_ERROR_CODES, SCREENS } from "../../config/screens";
import { KYC_PATH_LABELS } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBasicDetails } from "../../services/onboardingApi";
import { useOnboardingStatusStore } from "../../store/statusStore";
import { useSavedBrandStore } from "../../store/brandStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";
import { STATUS_OPTIONS } from "./businessStatusOptions";

/** "Pill + Next you'll add" block inside each radio card. */
function NextItems({ option, selected }) {
  return (
    <span className="flex flex-col gap-3">
      <StatusPill tone={selected ? "success" : "neutral"}>{option.pill}</StatusPill>
      <span className="block border-t border-gray-200 pt-3 dark:border-gray-700">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Next you&apos;ll add
        </span>
        <span className="mt-1.5 flex flex-col gap-1">
          {option.nextItems.map((item) => (
            <span key={item} className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {option.verified ? (
                <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
              )}
              {item}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * REGISTRATION_STATUS (guide §4.3) — picks the verification path. Saved with
 * `add-basic-details { step: REGISTRATION_STATUS, kycPath }`; the server
 * answers with the path's first screen. Read-only once
 * `status.registrationStatusLocked` (GST saved on GST path / PAN on NO_GST).
 */
export default function BusinessStatusStep() {
  const { status, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  const savedPath = status?.kycPath ?? null;
  const locked = Boolean(status?.registrationStatusLocked) || status?.editable?.registrationStatus === false;

  const [picked, setPicked] = useState(null);
  // Nothing saved yet: the design pre-selects "I have GST".
  const selected = locked ? savedPath : picked ?? savedPath ?? KYC_PATHS.GST;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = useCallback(async () => {
    if (!selected || saving) return;
    try {
      setSaving(true);
      setError("");
      const res = await addBasicDetails(SCREENS.REGISTRATION_STATUS, { kycPath: selected });
      mergeBrand(res?.data?.brand);
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Business status save failed:", err);
      setError(onboardingErrorMessage(err, "Couldn't save your business status. Please try again."));
      // Locked in the meantime (another tab saved GST / PAN): show it locked.
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.REGISTRATION_STATUS_LOCKED) {
        fetchStatus().catch((refreshError) => console.error("Onboarding status refresh failed:", refreshError));
      }
    } finally {
      setSaving(false);
    }
  }, [fetchStatus, goToServerScreen, handleFlowError, mergeBrand, saving, selected]);

  return (
    <StepCard
      icon={CircleHelp}
      title="Which one describes your business?"
      subtitle="This decides what we verify next. All three can sell on Trydood."
      footer={
        <StepFooter start={<FormError message={error} />}>
          <Button onClick={handleContinue} disabled={!selected} loading={saving} icon={ArrowRight}>
            Continue
          </Button>
        </StepFooter>
      }
    >
      <div role="group" aria-label="Business status" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selected === option.kycPath;
          return (
            <OptionCard
              key={option.kycPath}
              icon={option.icon}
              title={KYC_PATH_LABELS[option.kycPath]}
              description={option.description}
              selected={isSelected}
              disabled={locked && option.kycPath !== savedPath}
              onSelect={() => {
                setPicked(option.kycPath);
                setError("");
              }}
            >
              <NextItems option={option} selected={isSelected} />
            </OptionCard>
          );
        })}
      </div>

      {locked ? (
        <Notice icon={Lock}>
          <strong className="font-bold">Locked — your GST / PAN is saved.</strong> Your business status stays &ldquo;
          {KYC_PATH_LABELS[savedPath]}&rdquo;. To change it, contact support.
        </Notice>
      ) : (
        <Notice>Picked the wrong one? You can change it until your GST or PAN is saved.</Notice>
      )}
    </StepCard>
  );
}
