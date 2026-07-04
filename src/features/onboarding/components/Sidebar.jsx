import { useNavigate } from "react-router-dom";
import { STEPS } from "@/features/onboarding/constants/steps";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore, computeCanGoBack } from "@/features/onboarding/store/onboardingStore";
import TrydoodLogo from "@/assets/svg/trydood.svg";

const SIDEBAR_STEPS = [
  { id: STEPS.BASIC_DETAILS,         label: "Basic Details",         icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: STEPS.BUSINESS_VERIFICATION, label: "Business Verification", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: STEPS.BANK_VERIFICATION,     label: "Bank Verification",     icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { id: STEPS.SYSTEM_VERIFY,         label: "System Verify",         icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" },
  { id: STEPS.PARTNER_CONTRACT,      label: "Partner Contract",      icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
];

const SUB_MAX = {
  [STEPS.BASIC_DETAILS]:         3,
  [STEPS.BUSINESS_VERIFICATION]: 4,
  [STEPS.BANK_VERIFICATION]:     2,
  [STEPS.SYSTEM_VERIFY]:         1,
  [STEPS.PARTNER_CONTRACT]:      1,
};

const STEP_ORDER = [
  STEPS.BASIC_DETAILS,
  STEPS.BUSINESS_VERIFICATION,
  STEPS.BANK_VERIFICATION,
  STEPS.SYSTEM_VERIFY,
  STEPS.PARTNER_CONTRACT,
];

const TOTAL_SUBSTEPS = STEP_ORDER.reduce((acc, s) => acc + SUB_MAX[s], 0);

function calcGranularProgress(currentStep, currentSubStep) {
  let done = 0;
  for (const stepId of STEP_ORDER) {
    if (stepId < currentStep) {
      done += SUB_MAX[stepId];
    } else if (stepId === currentStep) {
      done += currentSubStep - 1;
      break;
    } else {
      break;
    }
  }
  return Math.round((done / TOTAL_SUBSTEPS) * 100);
}

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" fill="#10b981" />
    <polyline points="7 12 10.5 15.5 17 9" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ActiveCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" fill="white" stroke="#10b981" strokeWidth="2" />
    <circle cx="12" cy="12" r="5" fill="#10b981" />
  </svg>
);

const DoneLockCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
    <polyline points="7 12 10.5 15.5 17 9" stroke="#10b981" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" fill="#e5e7eb" />
    <rect x="8" y="11" width="8" height="6" rx="1" fill="none" stroke="#6b7280" strokeWidth="1.5" />
    <path d="M9.5 11V9a2.5 2.5 0 0 1 5 0v2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PendingCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" fill="#f3f7ff" stroke="#e5e7eb" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="#d1d5db" />
  </svg>
);

const Chevron = ({ color = "#d1d5db" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" className="flex-shrink-0">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const GrayLockChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="#9ca3af" strokeWidth="2.5" className="flex-shrink-0">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
  </svg>
);

export default function Sidebar({
  currentStep,
  currentSubStep = 1,
  goToStep,
  goBack,
  isFirst,
}) {
  const { logout }           = useAuthStore();
  const navigate             = useNavigate();
  const isCompleted          = useOnboardingStore((s) => s.isCompleted);
  const isStepFullyCompleted = useOnboardingStore((s) => s.isStepFullyCompleted);
  const canGoBack            = useOnboardingStore((s) => computeCanGoBack(s));

  const systemVerifyDone    = isCompleted(STEPS.SYSTEM_VERIFY, 1);
  // ✅ CHANGED: partner contract bhi check karo
  const partnerContractDone = isCompleted(STEPS.PARTNER_CONTRACT, 1);

  const handleLogout = () => { logout(); navigate("/"); };

  const pct = calcGranularProgress(currentStep, currentSubStep);

  const backDisabled = isFirst || systemVerifyDone || !canGoBack;

  return (
    <div
      className="w-64 flex-shrink-0 flex flex-col self-stretch bg-gray-100 min-h-full border-r border-gray-200 relative"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      <div style={{ position: "absolute", left: 4, top: 20, bottom: 20, width: 8, zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#e5e7eb", borderRadius: 999 }} />
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%",
          height: `${pct}%`, backgroundColor: "#10b981",
          borderRadius: 999, transition: "height 0.4s ease",
        }} />
      </div>

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-center gap-2.5 mb-4 ml-6">
          <div className="rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={TrydoodLogo} alt="Trydood_Logo" className="w-20 h-14 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <button
          onClick={goBack}
          disabled={backDisabled}
          className={`flex items-center ml-6 gap-1.5 text-[13px] font-medium transition-colors
            ${backDisabled
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:text-emerald-500 cursor-pointer"
            }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      <div className="h-px bg-gray-200 mx-4 mb-2" />

      <div className="flex flex-1 pb-4 pt-4 px-3">
        <div className="flex flex-col flex-1 ml-2.5 gap-4.5">
          {SIDEBAR_STEPS.map((step) => {
            const isPartnerContract = step.id === STEPS.PARTNER_CONTRACT;

            let isActive     = false;
            let isDoneLocked = false;
            let isHardLocked = false;
            let isFuture     = false;

            if (systemVerifyDone) {
              if (isPartnerContract) {
                // ✅ CHANGED: partner contract done ho to hardLock, warna active
                if (partnerContractDone) {
                  isHardLocked = true;
                } else {
                  isActive = true;
                }
              } else {
                isHardLocked = true;
              }
            } else {
              if (step.id === currentStep) {
                isActive = true;
              } else if (step.id < currentStep || isStepFullyCompleted(step.id)) {
                isDoneLocked = true;
              } else {
                isFuture = true;
              }
            }

            const nonClickable = isDoneLocked || isHardLocked || isFuture;

            return (
              <button
                key={step.id}
                onClick={() => {
                  if (nonClickable) return;
                  goToStep(step.id);
                }}
                disabled={nonClickable}
                className={`flex items-center gap-3 w-full text-left
                  px-2 py-1.5 rounded-xl transition-all duration-200
                  ${isActive      ? "bg-emerald-50 ring-1 ring-emerald-200 cursor-pointer"
                  : isDoneLocked  ? "opacity-75 cursor-not-allowed"
                  : isHardLocked  ? "opacity-50 cursor-not-allowed"
                  : isFuture      ? "opacity-40 cursor-not-allowed"
                                  : "cursor-pointer hover:bg-white"}`}
              >
                <div className="flex-shrink-0">
                  {isActive      && <ActiveCircle />}
                  {isDoneLocked  && <DoneLockCircle />}
                  {isHardLocked  && <LockCircle />}
                  {isFuture      && <PendingCircle />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`block text-xs font-semibold leading-tight truncate
                    ${isActive      ? "text-emerald-800"
                    : isDoneLocked  ? "text-gray-500"
                    : isHardLocked  ? "text-gray-800"
                                    : "text-gray-700"}`}>
                    {step.label}
                  </span>
                </div>

                <div className="flex-shrink-0">
                  {isActive     && <Chevron color="#10b981" />}
                  {isDoneLocked && <GrayLockChevron />}
                  {isHardLocked && <GrayLockChevron />}
                  {isFuture     && <Chevron color="#e5e7eb" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 flex justify-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[11px] font-medium w-full justify-center
            transition-all rounded-xl py-2 px-3
            text-gray-400 border border-gray-200
            hover:text-red-500 hover:border-red-200 hover:bg-red-50 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}