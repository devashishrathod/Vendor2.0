
import { useState } from "react";
import { STEPS, STEP_LABELS } from "@/features/onboarding/constants/steps";
import {
  useOnboardingStore,
  BASIC_SUB,
  BIZ_SUB,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";

import Sidebar from "@/features/onboarding/components/Sidebar";

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

// ── Mobile Header Bar ──────────────────────────────────────────────────────
function MobileHeader({ title, sub, onMenuOpen, pct, displayIndex, totalSteps, isLast }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between
      px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-xl
            bg-gray-50 border border-gray-200 text-gray-500 hover:bg-emerald-50
            hover:border-emerald-200 hover:text-emerald-600 transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-extrabold text-gray-900 leading-tight">{title}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[160px]">{sub}</p>
        </div>
      </div>

      {!isLast && (
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-emerald-600">Step {displayIndex} of {totalSteps}</p>
            <p className="text-[9px] text-gray-400">{pct}% Complete</p>
          </div>
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${pct * 0.879} ${87.9 - pct * 0.879}`} strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center
              text-[9px] font-black text-emerald-600">
              {pct}%
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Mobile Sidebar Drawer ──────────────────────────────────────────────────
function MobileSidebarDrawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 left-0 z-50 lg:hidden"
        style={{ animation: "drawerIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}
      >
        <style>{`
          @keyframes drawerIn {
            from { transform: translateX(-100%); opacity: 0.6; }
            to   { transform: translateX(0);     opacity: 1; }
          }
        `}</style>
        <div className="absolute top-4 right-[-44px] z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl
              bg-white shadow-md text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const {
    currentStep,
    currentSubStep,
    goToStep,
    goBack,
    markComplete,
    isCompleted,
  } = useOnboardingStore();

  const panDetails    = useOnboardingStore((s) => s.formData.panDetails);
  const completedKeys = useOnboardingStore((s) => s.completedKeys);

  const [bankAccountType, setBankAccountType] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);

  const systemVerifyDone = isCompleted(STEPS.SYSTEM_VERIFY, 1);

  const isFirst = currentStep === STEPS.BASIC_DETAILS && currentSubStep === 1;

  function completeAndGo(nextStep, nextSubStep = 1) {
    markComplete(currentStep, currentSubStep);
    goToStep(nextStep, nextSubStep);
  }

  function resolveComponent(step, subStep) {
    const locked = (() => {
      if (systemVerifyDone && step !== STEPS.PARTNER_CONTRACT) return true;
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

    if (step === STEPS.PARTNER_CONTRACT) return <Step14PartnerContract />;
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
    <div
      className="min-h-screen bg-white relative overflow-hidden flex flex-col lg:flex-row"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background decorations */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom left,rgba(16,185,129,0.13) 0%,transparent 70%)", zIndex: 0 }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right,rgba(99,102,241,0.06) 0%,transparent 70%)", zIndex: 0 }} />

      {/* ── DESKTOP Sidebar ── */}
      <div className="hidden lg:block relative flex-shrink-0" style={{ zIndex: 1 }}>
        <Sidebar {...sidebarProps} />
      </div>

      {/* ── MOBILE Sidebar Drawer ── */}
      <MobileSidebarDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Sidebar {...sidebarProps} />
      </MobileSidebarDrawer>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex flex-col flex-1 min-w-0 min-h-screen" style={{ zIndex: 1 }}>

        {/* ── Mobile top bar ── */}
        <MobileHeader
          title="Vendor Onboarding"
          sub={headerSub}
          onMenuOpen={() => setMobileMenuOpen(true)}
          pct={pct}
          displayIndex={displayIndex}
          totalSteps={totalSteps}
          isLast={isLast}
        />

        {/* ── Desktop top bar ── */}
        <header className="hidden lg:flex px-8 pt-5 pb-4 items-center justify-between
          border-b border-gray-100/80 backdrop-blur-sm bg-white/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 leading-tight">Vendor Onboarding</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">{headerSub}</p>
            </div>
          </div>

          {!isLast && (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-[11px] font-bold text-emerald-600">Step {displayIndex} of {totalSteps}</p>
                <p className="text-[9px] text-gray-400">{pct}% Complete</p>
              </div>
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${pct * 0.879} ${87.9 - pct * 0.879}`} strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center
                  text-[9px] font-black text-emerald-600">
                  {pct}%
                </span>
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col min-h-0 py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
          {!isLast && (
            <div className="inline-flex items-center gap-1.5 mb-4 bg-emerald-50
              px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">
                Step {displayIndex} of {totalSteps}{subLabel ? ` · ${subLabel}` : ""}
              </span>
            </div>
          )}

          {hasSubDots && (
            <SubStepDots total={SUB_TOTALS[currentStep]} current={currentSubStep} />
          )}

          <div
            key={`${currentStep}-${currentSubStep}`}
            className="flex-1 flex items-start justify-center"
            style={{ animation: "stepFadeIn 0.35s ease both" }}
          >
            <div className="w-full">{stepComponent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

