import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useOnboardingStore,
  BASIC_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { updateRegistrationStatus } from "@/features/onboarding/services/api/brand.api";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorToast from "@/components/common/ErrorToast";

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className = "",
  variant = "emerald",
}) {
  const variants = {
    emerald:
      disabled || loading
        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
        : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]",
    danger: "bg-red-500 hover:bg-red-600 text-white active:scale-[0.98]",
    ghost: "bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-[0.98]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`py-3 px-5 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────
function OptionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  badge,
  accent,
  points,
  pointsLabel,
}) {
  const styles = {
    emerald: {
      card: selected
        ? "border-2 border-emerald-400 bg-emerald-50/50 shadow-sm shadow-emerald-100"
        : "border border-gray-200 hover:border-emerald-200 hover:bg-gray-50/40",
      iconWrap: selected ? "bg-emerald-100" : "bg-gray-100",
      iconColor: selected ? "text-emerald-600" : "text-gray-400",
      title: selected ? "text-emerald-700" : "text-gray-700",
      radio: selected
        ? "border-emerald-500 bg-emerald-500"
        : "border-gray-300 bg-white",
      badge: selected
        ? "bg-emerald-100 text-emerald-700"
        : "bg-gray-100 text-gray-500",
      bullet: "text-emerald-500",
      labelColor: "text-gray-500",
    },
    blue: {
      card: selected
        ? "border-2 border-blue-400 bg-blue-50/50 shadow-sm shadow-blue-100"
        : "border border-gray-200 hover:border-blue-200 hover:bg-gray-50/40",
      iconWrap: selected ? "bg-blue-100" : "bg-gray-100",
      iconColor: selected ? "text-blue-600" : "text-gray-400",
      title: selected ? "text-blue-700" : "text-gray-700",
      radio: selected
        ? "border-blue-500 bg-blue-500"
        : "border-gray-300 bg-white",
      badge: selected
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-500",
      bullet: "text-amber-500",
      labelColor: "text-gray-500",
    },
  };
  const s = styles[accent] || styles.emerald;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2.5 p-3.5 rounded-xl transition-all duration-200 text-left w-full h-full ${s.card}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${s.iconWrap}`}
        >
          <span className={`transition-colors duration-200 ${s.iconColor}`}>
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-[13px] font-semibold transition-colors duration-200 ${s.title}`}
          >
            {title}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
            {subtitle}
          </p>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${s.radio}`}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>

      {badge && (
        <span
          className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors duration-200 ${s.badge}`}
        >
          {badge}
        </span>
      )}

      <div className="border-t border-gray-100 pt-2 mt-auto">
        <p
          className={`text-[9px] font-semibold uppercase tracking-widest mb-1.5 ${s.labelColor}`}
        >
          {pointsLabel}
        </p>
        <ul className="flex flex-col gap-1">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className={`text-xs ${s.bullet}`}>
                {accent === "emerald" ? "✓" : "•"}
              </span>
              <span className="text-[11px] text-gray-500 leading-snug">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

// ── Right Panel Illustration ──────────────────────────────────────────────────
function CityIllustration() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-auto">
      <rect width="320" height="180" rx="16" fill="#eef6f1" />
      <circle cx="270" cy="40" r="22" fill="#dff1e6" />
      <circle cx="60" cy="35" r="14" fill="#dff1e6" />
      <rect x="20" y="80" width="40" height="80" rx="4" fill="#34d399" opacity="0.85" />
      <rect x="65" y="60" width="34" height="100" rx="4" fill="#10b981" />
      <rect x="104" y="95" width="30" height="65" rx="4" fill="#6ee7b7" />
      <rect x="220" y="70" width="38" height="90" rx="4" fill="#34d399" opacity="0.85" />
      <rect x="262" y="50" width="34" height="110" rx="4" fill="#10b981" />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 3 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={72 + c * 9}
            y={70 + r * 18}
            width="5"
            height="8"
            rx="1"
            fill="#a7f3d0"
          />
        ))
      )}
      <g transform="translate(118,55)">
        <rect width="84" height="100" rx="10" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
        <rect x="14" y="16" width="56" height="8" rx="2" fill="#10b981" />
        <rect x="14" y="32" width="40" height="6" rx="2" fill="#a7f3d0" />
        <rect x="14" y="44" width="48" height="6" rx="2" fill="#a7f3d0" />
        <text x="42" y="70" textAnchor="middle" fontSize="12" fontWeight="700" fill="#10b981">
          GST
        </text>
        <circle cx="42" cy="88" r="9" fill="#10b981" />
        <path
          d="M38 88l3 3 6-6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="30" cy="160" r="10" fill="#a7f3d0" opacity="0.7" />
      <rect x="290" y="140" width="3" height="20" fill="#86efac" />
      <circle cx="291" cy="138" r="8" fill="#6ee7b7" />
    </svg>
  );
}

const WHY_ITEMS = [
  {
    title: "Build Trust",
    desc: "Registered businesses are more credible to customers and partners.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Unlock Benefits",
    desc: "Get access to advanced features, higher limits, and financial services.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Stay Compliant",
    desc: "Ensure legal compliance and smooth business operations.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

function RightInfoPanel() {
  return (
    <div className="w-full md:w-[260px] flex-shrink-0 flex flex-col gap-3 mt-[-74px]">
      <div className="rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50/40 p-2">
        <CityIllustration />
      </div>

      <div className="rounded-xl border border-gray-100 p-3.5 flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-gray-800">
          Why registration matters?
        </p>
        <div className="flex flex-col gap-2.5">
          {WHY_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-700">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a4 4 0 115.657 0c-.62.62-1.026 1.13-1.184 1.766A2 2 0 0112 19.5h-1a2 2 0 01-1.937-1.563c-.158-.636-.564-1.146-1.184-1.766z"
            />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-700">Not sure?</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
            You can always update your registration details later from
            account settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared: Blocking Content ──────────────────────────────────────────────────
const REASONS = [
  "Ensures secure and compliant business operations.",
  "Builds trust and credibility with customers.",
  "Enables secure payments and transaction processing.",
  "Helps maintain quality and transparency across the platform.",
  "Protects both businesses and consumers.",
];

function BlockingContent({ onRegister, onDelete, deleting }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* LEFT — Info */}
      <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-snug mb-1">
              Business Registration Required
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              To maintain a trusted and compliant marketplace, Trydood currently
              supports only registered businesses and brands.
            </p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Please complete your business registration to continue. If you need
            assistance, our support team is happy to help.
          </p>
        </div>
        <div className="border-t border-gray-100" />
        <div>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-2.5">
            Why is registration required?
          </p>
          <ul className="flex flex-col gap-2">
            {REASONS.map((text, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 block" />
                </div>
                <span className="text-xs text-gray-500 leading-snug">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT — Actions */}
      <div className="p-7 flex flex-col item-center justify-center gap-4 bg-gray-50/40">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Complete Registration
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Unlock all features on Trydood
              </p>
            </div>
          </div>
          {/* ✅ Centered button */}
          <div className="flex justify-center">
            <PrimaryButton className="w-auto px-8" onClick={onRegister}>
              Complete Business Registration
            </PrimaryButton>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              Need help with registration?
            </p>
            <a
              href="mailto:TrydoodTeam@gmail.com"
              className="text-sm text-emerald-500 hover:text-emerald-600 font-medium hover:underline transition"
            >
              trydoodteam@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Blocking Modal ────────────────────────────────────────────────────────────
function BlockingModal({ onClose, onDelete, onSelectRegistered }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeleting(false);
    onDelete();
  };

  const handleRegister = () => {
    // ✅ sirf registered select karo aur modal band karo
    // API call tab hogi jab user Continue dabayega
    onSelectRegistered();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm bg-black/10"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease both" }}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl relative overflow-hidden"
          style={{
            animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
            pointerEvents: "auto",
          }}
        >
          <style>{`
            @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
            @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
          `}</style>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <BlockingContent
            onRegister={handleRegister}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </div>
      </div>
    </>
  );
}

// ── Blocking Page ─────────────────────────────────────────────────────────────
function BlockingPage({ onDelete }) {
  const { goToStep } = useOnboardingStore();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeleting(false);
    onDelete?.();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(239,68,68,0.06) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.07) 0%, transparent 65%)",
        }}
      />
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative z-10">
        <BlockingContent
          onRegister={() =>
            goToStep(STEPS.BASIC_DETAILS, BASIC_SUB.REGISTRATION_STATUS)
          }
          onDelete={handleDelete}
          deleting={deleting}
        />
      </div>
    </div>
  );
}

// ── Step 4 — Main Export ──────────────────────────────────────────────────────
export default function Step4IsRegistered() {
  const { setSubStep } = useOnboardingStore();
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [apiError, setApiError] = useState(null);

  // ✅ API call — registered select karke continue dabane par
  const proceedAsRegistered = async () => {
    setLoading(true);
    setApiError(null);
    try {
      await updateRegistrationStatus({ status: "REGISTERED" });
      setSuccessMsg("Registration status updated successfully.");
      setTimeout(() => {
        setSubStep(BASIC_SUB.REGISTRATION_ENTITY_TYPE);
      }, 5000);
    } catch (err) {
      setApiError({
        status: err.status,
        message: err.message,
        txnId: err.txnId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selected) return;

    if (selected === "unregistered") {
      setShowModal(true);
      return;
    }

    // registered — API call tabhi hogi
    await proceedAsRegistered();
  };

  // ✅ Modal ke button se sirf select karo, modal band karo
  // API call user ke Continue dabane par hogi
  const handleSelectRegisteredFromModal = () => {
    setSelected("registered");
    setShowModal(false);
  };

  const handleDeleteAccount = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-6xl py-4">
        <div className="">
          <div className="flex flex-col md:flex-row gap-5">
            {/* LEFT — Main content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M9 12h6m-6 4h6M9 8h1M5 21h14a2 2 0 002-2V8.414a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0014.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-0.5">
                    Is your business registered?
                  </h2>
                  <p className="text-xs text-gray-400">
                    Select the most applicable option to continue
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <OptionCard
                  selected={selected === "registered"}
                  onClick={() => {
                    setSelected("registered");
                    setApiError(null);
                  }}
                  accent="emerald"
                  title="Registered Business"
                  subtitle="My business is officially registered with a valid PAN, GST, or other government documents."
                  badge="Recommended"
                  pointsLabel="What you get"
                  points={[
                    "Accept online payments",
                    "GST invoice & tax compliance",
                    "Access to all features",
                    "Eligible for marketplace & loans",
                  ]}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                />
                <OptionCard
                  selected={selected === "unregistered"}
                  onClick={() => {
                    setSelected("unregistered");
                    setApiError(null);
                  }}
                  accent="blue"
                  title="Unregistered Business"
                  subtitle="My business is not yet registered with any government authority."
                  badge="Not eligible"
                  pointsLabel="Please note"
                  points={[
                    "Limited features access",
                    "No GST invoice",
                    "Lower transaction limits",
                    "Verification required later",
                  ]}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  }
                />
              </div>

              {/* API Error */}
              {apiError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <svg
                    className="w-4 h-4 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-red-600 font-medium">
                    {apiError.message || "Something went wrong. Please try again."}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                {/* <button
                  onClick={() => window.history?.back?.()}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-2 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button> */}
                <p className="text-xs text-gray-300">Step 5 of 13</p>
                <PrimaryButton
                  onClick={handleContinue}
                  disabled={!selected}
                  loading={loading}
                >
                  {loading ? "Saving…" : "Continue →"}
                </PrimaryButton>
              </div>
            </div>

            {/* RIGHT — Image + info panel */}
            <RightInfoPanel />
          </div>
        </div>
      </div>

      {showModal && (
        <BlockingModal
          onClose={() => setShowModal(false)}
          onDelete={handleDeleteAccount}
          onSelectRegistered={handleSelectRegisteredFromModal}
        />
      )}

      <SuccessToast
        message={successMsg}
        onDismiss={() => setSuccessMsg(null)}
      />
      <ErrorToast error={apiError} onDismiss={() => setApiError(null)} />
    </div>
  );
}

export { BlockingPage };