import { useNavigate } from "react-router-dom";
import { STEPS, STEP_LABELS } from "@/features/onboarding/constants/steps";
import {
  useOnboardingStore, BASIC_SUB, BIZ_SUB, BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";

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

// ── Bubbles ───────────────────────────────────────────────────────────────────
// const BUBBLES = [
//   [110,'8%','6%','rgba(16,185,129,0.10)',6,0],
//   [70,'18%','28%','rgba(99,102,241,0.09)',8,1],
//   [90,'42%','3%','rgba(244,63,94,0.08)',7,2],
//   [60,'18%','82%','rgba(20,184,166,0.10)',9,0.5],
//   [80,'12%','62%','rgba(245,158,11,0.08)',7.5,3],
//   [45,'75%','12%','rgba(16,185,129,0.11)',5.5,1.5],
//   [50,'55%','22%','rgba(139,92,246,0.09)',10,2.5],
//   [65,'70%','72%','rgba(99,102,241,0.08)',8.5,1],
// ];

// ── Sidebar steps ─────────────────────────────────────────────────────────────
const SIDEBAR_STEPS = [
  { id: STEPS.BASIC_DETAILS,         label: "Basic Details",         sub: "STEP 1" },
  { id: STEPS.BUSINESS_VERIFICATION, label: "Business Verification", sub: "STEP 2" },
  { id: STEPS.SYSTEM_VERIFY,         label: "System Verify",         sub: "STEP 3" },
  { id: STEPS.BANK_VERIFICATION,     label: "Bank Verification",     sub: "STEP 4" },
  { id: STEPS.PARTNER_CONTRACT,      label: "Partner Contract",      sub: "STEP 5" },
];

// ── Sub-step dot counts ───────────────────────────────────────────────────────
const SUB_TOTALS = {
  [STEPS.BASIC_DETAILS]:         3,
  [STEPS.BUSINESS_VERIFICATION]: 4,
  [STEPS.BANK_VERIFICATION]:     2,
};

// ── Sub-step label ────────────────────────────────────────────────────────────
function getSubLabel(currentStep, currentSubStep) {
  if (currentStep === STEPS.BASIC_DETAILS) {
    return { 1: "Business Name", 2: "Registration", 3: "Business Type" }[currentSubStep] ?? "";
  }
  if (currentStep === STEPS.BUSINESS_VERIFICATION) {
    return { 1: "PAN Entry", 2: "PAN Details", 3: "GST Entry", 4: "GST Details" }[currentSubStep] ?? "";
  }
  if (currentStep === STEPS.BANK_VERIFICATION) {
    return { 1: "Enter Details", 2: "Verified" }[currentSubStep] ?? "";
  }
  return "";
}

// ── Resolve component ─────────────────────────────────────────────────────────
function resolveComponent(currentStep, currentSubStep) {
  if (currentStep === STEPS.BASIC_DETAILS) {
    if (currentSubStep === BASIC_SUB.NAME)          return <Step3BusinessName />;
    if (currentSubStep === BASIC_SUB.REGISTRATION)  return <Step4IsRegistered />;
    if (currentSubStep === BASIC_SUB.BUSINESS_TYPE) return <Step5BusinessType />;
  }
  if (currentStep === STEPS.BUSINESS_VERIFICATION) {
    if (currentSubStep === BIZ_SUB.PAN_ENTER)    return <Step6PANEnter />;
    if (currentSubStep === BIZ_SUB.PAN_READONLY)  return <Step7PANReadOnly />;
    if (currentSubStep === BIZ_SUB.GST_ENTER)    return <Step8GSTEnter />;
    if (currentSubStep === BIZ_SUB.GST_READONLY)  return <Step9GSTReadOnly />;
  }
  if (currentStep === STEPS.SYSTEM_VERIFY)     return <Step10SystemVerify />;
  if (currentStep === STEPS.BANK_VERIFICATION) {
    if (currentSubStep === BANK_SUB.ENTER)    return <Step11BankEnter />;
    if (currentSubStep === BANK_SUB.READONLY) return <Step12BankReadOnly />;
  }
  if (currentStep === STEPS.PARTNER_CONTRACT)  return <Step14PartnerContract />;
  return null;
}

// ── Sub-step dots ─────────────────────────────────────────────────────────────
function SubStepDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i + 1 < current   ? 'w-2 h-2 bg-emerald-400'  :
          i + 1 === current ? 'w-3 h-2 bg-emerald-500'  :
                              'w-2 h-2 bg-gray-200'
        }`} />
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ currentStep, goToStep, goBack, isFirst }) {
  return (
    <div className="w-52 flex-shrink-0 flex flex-col px-4 py-5"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Back button — disabled on very first sub-step */}
      <button
        onClick={goBack}
        disabled={isFirst}
        className={`flex items-center gap-1.5 text-[11px] transition mb-4 w-fit
          ${isFirst
            ? 'text-gray-200 cursor-not-allowed'
            : 'text-gray-400 hover:text-emerald-500 cursor-pointer'
          }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"/>
        </svg>
        Back
      </button>

      <div className="flex flex-col overflow-y-auto flex-1">
        {SIDEBAR_STEPS.map((step, idx) => {
          const isDone   = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLocked = step.id > currentStep;
          const isLast   = idx === SIDEBAR_STEPS.length - 1;

          return (
            <button key={step.id}
              onClick={() => !isLocked && goToStep(step.id)}
              className={`text-left flex items-stretch gap-3 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>

              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 2 }}>
                <div className="w-[2px] transition-colors duration-500"
                  style={{
                    flex:         1,
                    background:   isDone ? '#10b981' : '#e5e7eb',
                    marginTop:    idx === 0 ? 14 : 0,
                    marginBottom: isLast  ? 14 : 0,
                  }} />
              </div>

              <div className={`${isLast ? 'pb-0' : 'pb-3'} pt-0.5 flex items-start gap-1.5`}>
                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white
                  ${isDone ? 'bg-emerald-400' : isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-100'}`}>
                  {isDone   && <CheckIcon />}
                  {isLocked && <LockIcon />}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                </div>
                <div>
                  <p className={`text-[11px] font-semibold leading-none ${
                    isActive ? 'text-emerald-500' : isDone ? 'text-gray-700' : 'text-gray-300'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[9px] mt-0.5 tracking-wide ${
                    isActive ? 'text-emerald-400' : isDone ? 'text-gray-400' : 'text-gray-300'}`}>
                    {step.sub}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { currentStep, currentSubStep, goToStep, goBack } = useOnboardingStore();

  // Is this the very first screen? (disable Back)
  const isFirst = currentStep === STEPS.BASIC_DETAILS && currentSubStep === 1;

  const currentIndex = SIDEBAR_STEPS.findIndex(s => s.id === currentStep);
  const totalSteps   = SIDEBAR_STEPS.length;
  const displayIndex = currentIndex + 1;
  const pct = currentIndex < 0 ? 0
    : Math.round((currentIndex / (totalSteps - 1)) * 100);

  const isLast     = currentStep === STEPS.PARTNER_CONTRACT;
  const stepLabel  = STEP_LABELS[currentStep] ?? "";
  const subLabel   = getSubLabel(currentStep, currentSubStep);
  const hasSubDots = SUB_TOTALS[currentStep] !== undefined;

  const stepComponent = resolveComponent(currentStep, currentSubStep);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <style>{`
        .ob-bubble {
          position: absolute; border-radius: 50%;
          backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
          border: 1.5px solid rgba(255,255,255,0.55);
          pointer-events: none; z-index: 0;
          animation: obFloat ease-in-out infinite;
        }
        @keyframes obFloat {
          0%,100% { transform: translateY(0) scale(1) }
          50%      { transform: translateY(-14px) scale(1.03) }
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {/* Glows */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left,rgba(16,185,129,0.13) 0%,transparent 70%)', zIndex: 0 }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right,rgba(99,102,241,0.06) 0%,transparent 70%)', zIndex: 0 }} />

      {/* Bubbles */}
      {/* {BUBBLES.map(([size, top, left, bg, dur, delay], i) => (
        <div key={i} className="ob-bubble" style={{
          width: size, height: size, top, left, background: bg,
          boxShadow: `inset 0 0 ${size * 0.15}px ${bg}, 0 4px ${size * 0.2}px ${bg}`,
          animationDuration: `${dur}s`, animationDelay: `${delay}s`,
        }} />
      ))} */}

      <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>

        {/* Header */}
        <header className="px-8 pt-5 pb-4 flex items-center justify-between border-b border-gray-100/80 backdrop-blur-sm bg-white/70">
          <div className="flex items-center gap-3">
            <span className="text-base font-extrabold text-emerald-500 tracking-tight">Trydood</span>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 leading-tight">Vendor Onboarding</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">{subLabel || stepLabel}</p>
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
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-emerald-600">
                  {pct}%
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Body */}
        <div className="flex flex-1 px-8 py-6 gap-6 min-h-0">
          <Sidebar
            currentStep={currentStep}
            goToStep={goToStep}
            goBack={goBack}
            isFirst={isFirst}
          />
          <div className="w-px bg-gray-100 flex-shrink-0" />

          <div className="flex-1 flex flex-col min-w-0">

            {/* Step chip */}
            {!isLast && (
              <div className="inline-flex items-center gap-1.5 mb-4 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">
                  Step {displayIndex} of {totalSteps}{subLabel ? ` · ${subLabel}` : ""}
                </span>
              </div>
            )}

            {/* Sub-step dots */}
            {hasSubDots && (
              <SubStepDots total={SUB_TOTALS[currentStep]} current={currentSubStep} />
            )}

            {/* Animated content */}
            <div
              key={`${currentStep}-${currentSubStep}`}
              className="flex-1 flex items-start justify-center"
              style={{ animation: 'stepFadeIn 0.35s ease both' }}
            >
              <div className="w-full">{stepComponent}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}