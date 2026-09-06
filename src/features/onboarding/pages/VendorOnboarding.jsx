import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { STEPS, STEP_LABELS } from "@/features/onboarding/constants/steps";
import {
  useOnboardingStore,
  BASIC_SUB,
  BIZ_SUB,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { useAuthStore } from "@/features/onboarding/store/authStore";

import OnboardingLayout from "@/features/onboarding/components/OnboardingLayout";

import Step3BusinessName     from "@/features/onboarding/steps/Step3BusinessName";
import Step4IsRegistered     from "@/features/onboarding/steps/Step4IsRegistered";
import Step5BusinessType     from "@/features/onboarding/steps/Step5BusinessType";
import Step6PANEnter         from "@/features/onboarding/steps/Step6PANEnter";
import Step7PANReadOnly      from "@/features/onboarding/steps/Step7PANReadOnly";
import Step8GSTEnter         from "@/features/onboarding/steps/Step8GSTEnter";
import Step9GSTReadOnly      from "@/features/onboarding/steps/Step9GSTReadOnly";
import Step10SystemVerify    from "@/features/onboarding/steps/Step10SystemVerify";
import Step11BankEnter       from "@/features/onboarding/steps/Step11BankEnter";
import Step12BankReadOnly    from "@/features/onboarding/steps/Step12BankReadOnly";
import Step14PartnerContract from "@/features/onboarding/steps/Step14PartnerContract";

const SUB_TOTALS = {
  [STEPS.BASIC_DETAILS]:         3,
  [STEPS.BUSINESS_VERIFICATION]: 4,
  [STEPS.BANK_VERIFICATION]:     2,
};

const SCREEN_ROUTES = {
  SUBSCRIBE_PLAN: "/subscription",
  UNDER_REVIEW:   "/under-review",
  DASHBOARD:      "/oulet",
};

function getSubLabel(currentStep, currentSubStep) {
  if (currentStep === STEPS.BASIC_DETAILS) {
    return {
      [BASIC_SUB.BUSINESS_NAME]:            "Business Name",
      [BASIC_SUB.REGISTRATION_STATUS]:      "Registration Status",
      [BASIC_SUB.REGISTRATION_ENTITY_TYPE]: "Business Type",
    }[currentSubStep] ?? "";
  }
  if (currentStep === STEPS.BUSINESS_VERIFICATION) {
    return {
      [BIZ_SUB.PAN_VERIFICATION]: "PAN Verification",
      [BIZ_SUB.PAN_READONLY]:     "PAN Details",
      [BIZ_SUB.GST_VERIFICATION]: "GST Verification",
      [BIZ_SUB.GST_READONLY]:     "GST Details",
    }[currentSubStep] ?? "";
  }
  if (currentStep === STEPS.BANK_VERIFICATION) {
    return {
      [BANK_SUB.BANK_VERIFICATION]: "Bank Verification",
      [BANK_SUB.BANK_READONLY]:     "Bank Details",
    }[currentSubStep] ?? "";
  }
  if (currentStep === STEPS.SYSTEM_VERIFY)    return "System Verification";
  if (currentStep === STEPS.PARTNER_CONTRACT) return "Partnership Deed";
  return "";
}

function SubStepDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i + 1 < current     ? "w-2 h-2 bg-emerald-400"
          : i + 1 === current ? "w-3 h-2 bg-emerald-500"
                              : "w-2 h-2 bg-gray-200"
        }`} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();

  const currentScreen = useAuthStore((s) => s.currentScreen);
  useEffect(() => {
    const route = SCREEN_ROUTES[currentScreen];
    if (route) navigate(route, { replace: true });
  }, [currentScreen]);

  const {
    currentStep,
    currentSubStep,
    goToStep,
    goBack,
    markComplete,
    markStepComplete,
    isCompleted,
  } = useOnboardingStore();

  // ✅ NEW — global toast lives here, at the top level, OUTSIDE the
  // key={`${currentStep}-${currentSubStep}`} wrapper below. This means
  // it never unmounts when a step navigates, so it always finishes
  // its own display duration regardless of navigation timing.
  const toastMessage = useOnboardingStore((s) => s.toastMessage);
  const clearToast    = useOnboardingStore((s) => s.clearToast);

  const panDetails    = useOnboardingStore((s) => s.formData.panDetails);
  const completedKeys = useOnboardingStore((s) => s.completedKeys);

  const [bankAccountType, setBankAccountType] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);

  const systemVerifyDone    = isCompleted(STEPS.SYSTEM_VERIFY, 1);
  const partnerContractDone = isCompleted(STEPS.PARTNER_CONTRACT, 1);
  const isFirst = currentStep === STEPS.BASIC_DETAILS && currentSubStep === 1;

  useEffect(() => {
    if (!partnerContractDone) return;

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [partnerContractDone]);

  function completeAndGo(nextStep, nextSubStep = 1) {
    if (nextStep !== currentStep) {
      markStepComplete(currentStep);
    } else {
      markComplete(currentStep, currentSubStep);
    }
    goToStep(nextStep, nextSubStep);
  }

  function handlePartnerComplete(backendScreen) {
    markComplete(STEPS.PARTNER_CONTRACT, 1);
    console.log('[OnboardingPage] handlePartnerComplete backendScreen:', backendScreen);
    const route = SCREEN_ROUTES[backendScreen] ?? "/subscription";
    navigate(route);
  }

  function resolveComponent(step, subStep) {
    const locked = (() => {
      if (step === STEPS.PARTNER_CONTRACT) {
        return isCompleted(step, subStep);
      }
      if (systemVerifyDone) return true;
      return isCompleted(step, subStep);
    })();

    if (step === STEPS.BASIC_DETAILS) {
      if (subStep === BASIC_SUB.BUSINESS_NAME)
        return <Step3BusinessName locked={locked} onComplete={() =>
          completeAndGo(STEPS.BASIC_DETAILS, BASIC_SUB.REGISTRATION_STATUS)} />;
      if (subStep === BASIC_SUB.REGISTRATION_STATUS)
        return <Step4IsRegistered locked={locked} onComplete={() =>
          completeAndGo(STEPS.BASIC_DETAILS, BASIC_SUB.REGISTRATION_ENTITY_TYPE)} />;
      if (subStep === BASIC_SUB.REGISTRATION_ENTITY_TYPE)
        return <Step5BusinessType locked={locked} onComplete={() =>
          completeAndGo(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_VERIFICATION)} />;
    }

    if (step === STEPS.BUSINESS_VERIFICATION) {
      if (subStep === BIZ_SUB.PAN_VERIFICATION)
        return <Step6PANEnter locked={locked} />;
      if (subStep === BIZ_SUB.PAN_READONLY)
        return <Step7PANReadOnly panData={panDetails} locked={locked} />;
      if (subStep === BIZ_SUB.GST_VERIFICATION)
        return <Step8GSTEnter locked={locked} />;
      if (subStep === BIZ_SUB.GST_READONLY)
        return <Step9GSTReadOnly locked={locked} />;
    }

    if (step === STEPS.BANK_VERIFICATION) {
      if (subStep === BANK_SUB.BANK_VERIFICATION)
        return (
          <Step11BankEnter
            locked={locked}
            onFetchSuccess={(data) => {
              if (data?.accountType) setBankAccountType(data.accountType);
            }}
          />
        );
      if (subStep === BANK_SUB.BANK_READONLY)
        return <Step12BankReadOnly accountType={bankAccountType} locked={locked} />;
    }

    if (step === STEPS.SYSTEM_VERIFY)
      return (
        <Step10SystemVerify
          locked={locked}
          onSuccess={() => {
            markComplete(STEPS.SYSTEM_VERIFY, 1);
            goToStep(STEPS.PARTNER_CONTRACT);
          }}
        />
      );

    if (step === STEPS.PARTNER_CONTRACT)
      return <Step14PartnerContract locked={locked} onComplete={handlePartnerComplete} />;

    return null;
  }

  const SIDEBAR_STEP_IDS = [
    STEPS.BASIC_DETAILS,
    STEPS.BUSINESS_VERIFICATION,
    STEPS.BANK_VERIFICATION,
    STEPS.SYSTEM_VERIFY,
    STEPS.PARTNER_CONTRACT,
  ];

  const totalSteps   = SIDEBAR_STEP_IDS.length;
  const currentIndex = SIDEBAR_STEP_IDS.indexOf(currentStep);
  const displayIndex = currentIndex + 1;
  const pct = currentIndex < 0 ? 0 : Math.round((currentIndex / (totalSteps - 1)) * 100);

  const isLast        = currentStep === STEPS.PARTNER_CONTRACT;
  const stepLabel     = STEP_LABELS[currentStep] ?? "";
  const subLabel      = getSubLabel(currentStep, currentSubStep);
  const hasSubDots    = SUB_TOTALS[currentStep] !== undefined;
  const stepComponent = resolveComponent(currentStep, currentSubStep);

  const headerSub = subLabel || stepLabel;

  const sidebarProps = {
    currentStep,
    currentSubStep,
    goToStep: (step) => {
      setMobileMenuOpen(false);
      goToStep(step);
    },
    goBack: () => {
      goBack();
      setMobileMenuOpen(false);
    },
    isFirst,
    completedKeys,
  };

  return (
    <OnboardingLayout
      headerSub={headerSub}
      pct={pct}
      displayIndex={displayIndex}
      totalSteps={totalSteps}
      isLast={isLast}
      sidebarProps={sidebarProps}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpen={() => setMobileMenuOpen(true)}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      toastMessage={toastMessage}
      clearToast={clearToast}
    >
      <div
        key={`${currentStep}-${currentSubStep}`}
        className="flex-1 flex items-start justify-center"
        style={{ animation: "stepFadeIn 0.35s ease" }}
      >
        <div className="w-full">{stepComponent}</div>
      </div>
    </OnboardingLayout>
  );
}