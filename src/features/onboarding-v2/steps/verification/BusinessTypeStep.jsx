import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Briefcase, Lock } from "lucide-react";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import Button from "../../components/ui/Button";
import FormError from "../../components/ui/FormError";
import Notice from "../../components/ui/Notice";
import OptionCard from "../../components/ui/OptionCard";
import StatusPill from "../../components/ui/StatusPill";
import StepCard from "../../components/ui/StepCard";
import StepFooter from "../../components/ui/StepFooter";
import { KYC_PATHS, ONBOARDING_ERROR_CODES, SCREENS } from "../../config/screens";
import { ENTITY_LABELS, ENTITY_TYPES } from "../../constants/onboardingOptions";
import { useOnboardingFlow } from "../../hooks/useOnboardingFlow";
import { addBasicDetails } from "../../services/onboardingApi";
import { useSavedBrand, useSavedBrandStore } from "../../store/brandStore";
import { useVerifyStore } from "../../store/verifyStore";
import { onboardingErrorMessage } from "../../utils/errorMessages";

/**
 * REGISTRATION_ENTITY_TYPE — "Business entity" (guide §4.6), GST and NO_GST
 * paths. Saved with `add-basic-details { step: REGISTRATION_ENTITY_TYPE,
 * businessEntityType }`.
 *  - GST: read-only — the value the server set from GST
 *    (`derived.businessEntityType`); just "Confirm". Only when GST mapped to
 *    nothing (null), or the server answers 409 ENTITY_FROM_GST with
 *    `details.acceptedEntityTypes`, is a choice shown.
 *  - NO_GST: verify-pan's `suggestedEntity` pre-selected ("Recommended");
 *    the vendor may change it.
 */
export default function BusinessTypeStep() {
  const { kycPath, goToServerScreen, handleFlowError } = useOnboardingFlow();
  const { brand, loading } = useSavedBrand();
  const mergeBrand = useSavedBrandStore((s) => s.mergeBrand);
  const panResult = useVerifyStore((s) => s.results.PAN);

  const isGstPath = kycPath === KYC_PATHS.GST;
  const savedEntity = brand?.businessEntityType ?? null;
  const suggested = isGstPath ? savedEntity : panResult?.suggestedEntity ?? null;

  // 409 ENTITY_FROM_GST → only these values are accepted.
  const [acceptedTypes, setAcceptedTypes] = useState(null);
  const gstReadOnly = isGstPath && Boolean(savedEntity) && !acceptedTypes;

  const [picked, setPicked] = useState(null);
  const selected = gstReadOnly ? savedEntity : picked ?? savedEntity ?? suggested;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const options = useMemo(
    () => (acceptedTypes ? ENTITY_TYPES.filter((t) => acceptedTypes.includes(t.value)) : ENTITY_TYPES),
    [acceptedTypes],
  );

  const handleSelect = useCallback(
    (value) => {
      if (gstReadOnly) return;
      setPicked(value);
      setError("");
    },
    [gstReadOnly],
  );

  const handleContinue = useCallback(async () => {
    if (!selected || saving) return;
    try {
      setSaving(true);
      setError("");
      const res = await addBasicDetails(SCREENS.REGISTRATION_ENTITY_TYPE, { businessEntityType: selected });
      mergeBrand(res?.data?.brand);
      goToServerScreen(res?.data?.currentScreen);
    } catch (err) {
      if (handleFlowError(err)) return;
      console.error("Business entity save failed:", err);
      const accepted = getErrorDetails(err)?.acceptedEntityTypes;
      if (getErrorCode(err) === ONBOARDING_ERROR_CODES.ENTITY_FROM_GST && Array.isArray(accepted)) {
        setAcceptedTypes(accepted);
        setPicked(accepted[0] ?? null);
      }
      setError(onboardingErrorMessage(err, "We couldn't save your business entity. Please try again."));
    } finally {
      setSaving(false);
    }
  }, [goToServerScreen, handleFlowError, mergeBrand, saving, selected]);

  let subtitle = "Pick the type that matches your business registration.";
  if (gstReadOnly) subtitle = "Taken from your GST registration. Confirm it to continue.";
  else if (isGstPath && acceptedTypes) subtitle = "Your GST registration allows these business types. Pick yours.";
  else if (!isGstPath && suggested) subtitle = "We've recommended a type from your PAN. Change it only if it looks wrong.";

  return (
    <StepCard
      icon={Briefcase}
      title="Your business entity"
      subtitle={subtitle}
      footer={
        <StepFooter start={<FormError message={error} />}>
          <Button onClick={handleContinue} disabled={!selected || loading} loading={saving} icon={ArrowRight}>
            {saving ? "Saving…" : gstReadOnly ? "Confirm" : "Continue"}
          </Button>
        </StepFooter>
      }
    >
      {gstReadOnly ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-gray-50 p-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
          <span className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100">{ENTITY_LABELS[savedEntity] ?? savedEntity}</span>
          <StatusPill icon={Lock} tone="neutral">
            From GST · locked
          </StatusPill>
        </div>
      ) : (
        <div role="group" aria-label="Business entity" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {options.map((type) => (
            <OptionCard
              key={type.value}
              title={type.label}
              description={type.description}
              selected={selected === type.value}
              onSelect={() => handleSelect(type.value)}
              badge={!isGstPath && suggested === type.value ? <StatusPill>Recommended for you</StatusPill> : null}
            />
          ))}
        </div>
      )}

      {isGstPath && (
        <Notice icon={Lock}>
          Your business entity must match your GST registration. If it looks wrong, update it on the GST portal first, or
          contact support.
        </Notice>
      )}
    </StepCard>
  );
}
