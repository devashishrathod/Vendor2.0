import { useNavigate } from "react-router-dom";
import { STEPS } from "@/features/onboarding/constants/steps";
import { useAuthStore } from "@/features/onboarding/store/authStore";

const SIDEBAR_STEPS = [
  { id: STEPS.BASIC_DETAILS, label: "Basic Details" },
  { id: STEPS.BUSINESS_VERIFICATION, label: "Business Verification" },
  { id: STEPS.BANK_VERIFICATION, label: "Bank Verification" },
  { id: STEPS.SYSTEM_VERIFY, label: "System Verify" },
  { id: STEPS.PARTNER_CONTRACT, label: "Partner Contract" },
];

const CheckCircle = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="flex-shrink-0"
  >
    <circle cx="12" cy="12" r="10" fill="#10b981" />
    <polyline
      points="7 12 10.5 15.5 17 9"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ActiveCircle = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="flex-shrink-0"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="white"
      stroke="#10b981"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="5" fill="#10b981" />
  </svg>
);

const LockCircle = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="flex-shrink-0"
  >
    <circle cx="12" cy="12" r="10" fill="#f3f4f6" />
    <rect
      x="8"
      y="11"
      width="8"
      height="6"
      rx="1"
      fill="none"
      stroke="#c4c9d4"
      strokeWidth="1.5"
    />
    <path
      d="M9.5 11V9a2.5 2.5 0 0 1 5 0v2"
      stroke="#c4c9d4"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Chevron = ({ active, done }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#10b981" : done ? "#6b7280" : "#d1d5db"}
    strokeWidth="2.5"
    className="flex-shrink-0"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function Sidebar({ currentStep, goToStep, goBack, isFirst }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col self-stretch bg-gray-100 min-h-full border-r border-gray-200"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Back + Logout */}
      <div className="flex justify-between px-4 pt-5 pb-4">
        <button
          onClick={goBack}
          disabled={isFirst}
          className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors
            ${isFirst ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-emerald-500 cursor-pointer"}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[11px] font-medium transition-colors border border-gray-300 rounded-md py-1 px-3 text-gray-400 hover:text-red-500 hover:border-red-300 cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-4 mb-2" />

      {/* Steps — line + rows */}
      <div className="flex pb-4 pt-1 px-2.5">
        {/* Continuous vertical line */}
        <div className="relative flex-shrink-0" style={{ width: 8 }}>
          {/* gray base */}
          <div
            className="absolute inset-x-0 top-[14px] bottom-[14px] bg-gray-200"
            style={{ borderRadius: 2 }}
          />
          {/* green fill up to active step */}
          {(() => {
            const activeIdx = SIDEBAR_STEPS.findIndex(
              (s) => s.id === currentStep,
            );
            const pct =
              activeIdx <= 0
                ? 0
                : (activeIdx / (SIDEBAR_STEPS.length - 1)) * 100;
            return (
              <div
                className="absolute inset-x-0 top-[14px] bg-emerald-500 transition-all duration-500"
                style={{ borderRadius: 2, height: `${pct}%` }}
              />
            );
          })()}
        </div>

        {/* Step buttons */}
        <div className="flex flex-col flex-1 ml-2">
          {SIDEBAR_STEPS.map((step) => {
            const isDone = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isLocked = step.id > currentStep;

            return (
              <button
                key={step.id}
                onClick={() => !isLocked && goToStep(step.id)}
                className={`flex items-center gap-2.5 w-full text-left
                  px-2 py-3.5 rounded-xl transition-colors duration-200 flex-1
                  ${
                    isActive
                      ? "bg-emerald-50 cursor-pointer"
                      : isLocked
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:bg-gray-50"
                  }`}
              >
                {isDone && <CheckCircle />}
                {isActive && <ActiveCircle />}
                {isLocked && <LockCircle />}

                <span
                  className={`flex-1 text-xs font-semibold leading-tight
                  ${isActive ? "text-emerald-800" : isDone ? "text-gray-700" : "text-gray-400"}`}
                >
                  {step.label}
                </span>

                <Chevron active={isActive} done={isDone} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
