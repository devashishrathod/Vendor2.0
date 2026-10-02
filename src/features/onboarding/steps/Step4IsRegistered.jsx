import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useOnboardingStore,
  BASIC_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { updateRegistrationStatus } from "@/features/onboarding/services/api/brand.api";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorToast from "@/components/common/ErrorToast";
import { useTheme } from "@/context/ThemeContext";

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
        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
        : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]",
    danger: "bg-red-500 hover:bg-red-600 text-white active:scale-[0.98]",
    ghost: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 active:scale-[0.98]",
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
        ? "bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm shadow-emerald-100 dark:shadow-none"
        : "bg-white dark:bg-gray-800 hover:bg-gray-50/40 dark:hover:bg-gray-700/40",
      iconWrap: selected ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-gray-100 dark:bg-gray-700",
      iconColor: selected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400",
      title: selected ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300",
      radio: selected
        ? "bg-emerald-500"
        : "bg-white dark:bg-gray-800",
      badge: selected
        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
      bullet: "text-emerald-500",
      labelColor: "text-gray-500 dark:text-gray-400",
    },
    // ⚠️ FIXED: this key was already misleadingly named "blue" while
    // actually rendering red — swapped the palette to amber (harsh
    // error-red read as "you did something wrong"; amber reads as
    // "action needed", which is what an unregistered business actually
    // needs to see) and renamed the key to match.
    amber: {
      card: selected
        ? "bg-amber-50/50 dark:bg-amber-500/10 shadow-sm shadow-amber-100 dark:shadow-none"
        : "bg-white dark:bg-gray-800 hover:bg-gray-50/40 dark:hover:bg-gray-700/40",
      iconWrap: selected ? "bg-amber-100 dark:bg-amber-500/20" : "bg-gray-100 dark:bg-gray-700",
      iconColor: selected ? "text-amber-600 dark:text-amber-400" : "text-gray-400",
      title: selected ? "text-amber-700 dark:text-amber-400" : "text-gray-700 dark:text-gray-300",
      radio: selected
        ? "bg-amber-500"
        : "bg-white dark:bg-gray-800",
      badge: selected
        ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
      bullet: "text-amber-500",
      labelColor: "text-gray-500 dark:text-gray-400",
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
          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${s.radio}`}
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

      <div className="pt-2 mt-auto">
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
              <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

// ── City Illustration ─────────────────────────────────────────────────────────
function CityIllustration({ isUnregistered }) {
  // ⚠️ FIXED: these were fixed light hex values regardless of theme — in
  // dark mode this whole illustration rendered as a bright pastel card
  // sitting on the dark page. Only the two background fills (the card and
  // buildings keep their normal saturated colors, which read fine on
  // either background) get a muted dark-mode equivalent.
  const { isDark } = useTheme();
  // Amber palette for "unregistered" (was red — see OptionCard's `amber`
  // accent above for why), Tailwind's amber-50/100/300/400/500 hex values.
  const bg = isDark
    ? (isUnregistered ? "#2a2013" : "#122a22")
    : (isUnregistered ? "#fffbeb" : "#eef6f1");
  const circleFill = isDark
    ? (isUnregistered ? "#453619" : "#173a2d")
    : (isUnregistered ? "#fef3c7" : "#dff1e6");
  const tallBuild = isUnregistered ? "#fbbf24" : "#10b981";
  const midBuild = isUnregistered ? "#fcd34d" : "#34d399";
  const lightBuild = isUnregistered ? "#fde68a" : "#6ee7b7";
  const windowFill = isUnregistered ? "#fef3c7" : "#a7f3d0";
  const cardStroke = isUnregistered ? "#f59e0b" : "#10b981";
  const cardText = isUnregistered ? "#b45309" : "#10b981";
  const cardAccent = isUnregistered ? "#fcd34d" : "#a7f3d0";
  const circleBg = isUnregistered ? "#f59e0b" : "#10b981";

  return (
    <svg viewBox="0 0 320 180" className="w-full h-auto">
      <rect width="320" height="180" rx="16" fill={bg} />
      <circle cx="270" cy="40" r="22" fill={circleFill} />
      <circle cx="60" cy="35" r="14" fill={circleFill} />
      <rect x="20" y="80" width="40" height="80" rx="4" fill={midBuild} opacity="0.85" />
      <rect x="65" y="60" width="34" height="100" rx="4" fill={tallBuild} />
      <rect x="104" y="95" width="30" height="65" rx="4" fill={lightBuild} />
      <rect x="220" y="70" width="38" height="90" rx="4" fill={midBuild} opacity="0.85" />
      <rect x="262" y="50" width="34" height="110" rx="4" fill={tallBuild} />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 3 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={72 + c * 9}
            y={70 + r * 18}
            width="5"
            height="8"
            rx="1"
            fill={windowFill}
          />
        ))
      )}
      <g transform="translate(118,55)">
        <rect width="84" height="100" rx="10" fill="#ffffff" stroke={cardStroke} strokeWidth="2" />
        <rect x="14" y="16" width="56" height="8" rx="2" fill={cardStroke} />
        <rect x="14" y="32" width="40" height="6" rx="2" fill={cardAccent} />
        <rect x="14" y="44" width="48" height="6" rx="2" fill={cardAccent} />
        {isUnregistered ? (
          <>
            <text x="42" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill={cardText}>
              NO GST
            </text>
            <circle cx="42" cy="88" r="9" fill={circleBg} />
            <path
              d="M38 84l8 8M46 84l-8 8"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <text x="42" y="70" textAnchor="middle" fontSize="12" fontWeight="700" fill={cardText}>
              GST
            </text>
            <circle cx="42" cy="88" r="9" fill={circleBg} />
            <path
              d="M38 88l3 3 6-6"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </g>
      <circle cx="30" cy="160" r="10" fill={lightBuild} opacity="0.7" />
      <rect x="290" y="140" width="3" height="20" fill={lightBuild} />
      <circle cx="291" cy="138" r="8" fill={lightBuild} />
    </svg>
  );
}

// ── Right Info Panel ──────────────────────────────────────────────────────────
const WHY_ITEMS_REGISTERED = [
  {
    title: "Build Trust",
    desc: "Registered businesses can provide greater confidence to customers and partners.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Unlock Benefits",
    desc: "Access advanced features, higher limits, and financial services.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Stay Compliant",
    desc: "Keep your business operations aligned with applicable requirements.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ⚠️ FIXED: the previous 3 items ("Restricted Features"/"Lower Limits")
// implied a reduced-but-working tier still existed for an unregistered
// business — it doesn't; they can't use the platform at all until
// registered on trydood.com. Rewritten to match that (and the same flow
// described in the "Unregistered Business" option card above).
const WHY_ITEMS_UNREGISTERED = [
  {
    title: "No Platform Access",
    desc: "You can't list products, accept orders, or use vendor tools until you're registered.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    title: "Get Started Online",
    desc: "Visit trydood.com and submit the Get Started form to begin registration.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    ),
  },
  {
    title: "We'll Reach Out",
    desc: "Our team will contact you and guide you through the rest of the process.",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

function RightInfoPanel({ selectedOption }) {
  const isUnregistered = selectedOption === "unregistered";
  const isRegistered = selectedOption === "registered";

  const whyItems = isUnregistered ? WHY_ITEMS_UNREGISTERED : WHY_ITEMS_REGISTERED;

  const panelBorder = isUnregistered
    ? ""
    : isRegistered
      ? ""
      : "";

  const panelBg = isUnregistered
    ? "bg-amber-50/40 dark:bg-amber-500/10"
    : isRegistered
      ? "bg-emerald-50/40 dark:bg-emerald-500/10"
      : "bg-gray-50/40 dark:bg-gray-700/40";

  const iconBg = isUnregistered ? "bg-amber-100 dark:bg-amber-500/20" : "bg-emerald-100 dark:bg-emerald-500/20";
  const iconColor = isUnregistered ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  // ⚠️ FIXED: these had no dark: variant at all — text-gray-800/700 on the
  // app's dark-mode page background (bg-gray-900) is barely distinguishable,
  // effectively invisible. Also swapped unregistered's red for amber (see
  // OptionCard's `amber` accent above for why).
  const titleColor = isUnregistered ? "text-amber-700 dark:text-amber-400" : "text-gray-800 dark:text-gray-100";
  const headingColor = isUnregistered ? "text-amber-700 dark:text-amber-400" : "text-gray-700 dark:text-gray-300";

  const whyLabel = "Why business registration matters";

  return (
    // On mobile: no negative top margin, full width. On md+: original sidebar layout
    <div className="w-full md:w-[260px] flex-shrink-0 flex flex-col gap-3 md:mt-[-74px]">
      {/* Illustration */}
      <div
        className={`rounded-xl overflow-hidden p-2 transition-all duration-300 ${isUnregistered ? "bg-amber-50/40 dark:bg-amber-500/10" : "bg-emerald-50/40 dark:bg-emerald-500/10"
          }`}
      >
        <CityIllustration isUnregistered={isUnregistered} />
      </div>

      {/* Info card */}
      <div
        className={`rounded-xl p-3.5 flex flex-col gap-2.5 transition-all duration-300 ${panelBorder} ${panelBg}`}
      >
        <p className={`text-xs font-semibold transition-colors duration-300 ${titleColor}`}>
          {whyLabel}
        </p>
        <div className="flex flex-col gap-2.5">
          {whyItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${iconBg} ${iconColor}`}
              >
                {item.icon}
              </div>
              <div>
                <p className={`text-[11px] font-semibold transition-colors duration-300 ${headingColor}`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
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

function BlockingContent({ onDelete, deleting }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* LEFT — Info */}
      <div className="p-7 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-1">
              Business Registration Required
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              To maintain a trusted and compliant marketplace, Trydood currently
              supports only registered businesses and brands.
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Visit trydood.com and click Get Started to begin your registration.
            Once you submit the form there, our team will reach out to guide
            you through the next steps.
          </p>
        </div>
        <div className="" />
        <div>
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2.5">
            Why is registration required?
          </p>
          <ul className="flex flex-col gap-2">
            {REASONS.map((text, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 block" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT — Actions */}
      <div className="p-7 flex flex-col item-center justify-center gap-4 bg-gray-50/40 dark:bg-gray-900/40">
        <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/10 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Get Started on Trydood.com</p>
              <p className="text-xs text-gray-400 mt-0.5">Fill the Get Started form on our website</p>
            </div>
          </div>
          <div className="flex justify-center">
            {/* ⚠️ FIXED: this used to just flip the vendor back to
                "registered" and continue in-app — an unregistered business
                is no longer registered here at all. It now sends them to
                trydood.com's own Get Started form; the Trydood team reaches
                out from there to take them through registration. */}
            <a
              href="https://trydood.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-auto px-8 py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]"
            >
              Visit Trydood.com
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Need help with registration?</p>
            <a href="mailto:Helpdesk@trydood.com" className="text-sm text-emerald-500 hover:text-emerald-600 font-medium hover:underline transition">
              Helpdesk@trydood.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Blocking Modal ────────────────────────────────────────────────────────────
function BlockingModal({ onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeleting(false);
    onDelete();
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden"
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
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <BlockingContent
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
    <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(239,68,68,0.06) 0%, transparent 65%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.07) 0%, transparent 65%)" }}
      />
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden relative z-10">
        <BlockingContent
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

  const proceedAsRegistered = async () => {
    setLoading(true);
    setApiError(null);
    try {
      await updateRegistrationStatus({ status: "REGISTERED" });
      setSuccessMsg("Registration status updated successfully.");

      useOnboardingStore.getState().setToast("Registration status updated successfully.");
      setSubStep(BASIC_SUB.REGISTRATION_STATUS);
      setSubStep(BASIC_SUB.REGISTRATION_ENTITY_TYPE);

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
    await proceedAsRegistered();
  };

  const handleDeleteAccount = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <>
      {/*
        ── Mobile: pb-24 so sticky footer doesn't overlap content
        ── Desktop: no padding needed, button is inline
      */}
      <div className="flex items-center justify-center px-4 pb-24 md:pb-0">
        <div className="relative z-10 w-full max-w-6xl py-4">
          <div className="flex flex-col md:flex-row gap-5 mt-14">

            {/* LEFT — Main content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6M9 8h1M5 21h14a2 2 0 002-2V8.414a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0014.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                    Is your business registered?
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tell us your current business registration status.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <OptionCard
                  selected={selected === "registered"}
                  onClick={() => { setSelected("registered"); setApiError(null); }}
                  accent="emerald"
                  title="Registered Business"
                  subtitle="Your business is officially registered with a government authority and has valid registration documents."
                  badge="Recommended"
                  pointsLabel="With registration"
                  points={[
                    "Accept online payments",
                    "GST invoicing & tax compliance",
                    "Access all platform features",
                    "Eligible for marketplace & financing services",
                  ]}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                <OptionCard
                  selected={selected === "unregistered"}
                  onClick={() => { setSelected("unregistered"); setApiError(null); }}
                  accent="amber"
                  title="Unregistered Business"
                  subtitle="Your business is not currently registered with a government authority."
                  badge="Not eligible"
                  pointsLabel="What happens next"
                  points={[
                    "Visit trydood.com and click Get Started",
                    "Fill out the registration form there",
                    "Our team will reach out to guide you",
                    "Continue here once you're registered",
                  ]}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  }
                />
              </div>

              {/* API Error */}
              {apiError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 mb-4">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {apiError.message || "Something went wrong. Please try again."}
                  </p>
                </div>
              )}

              {/* Footer — visible only on md+ (desktop) */}
              <div className="hidden md:flex items-center justify-between pt-3 mt-1">
                <PrimaryButton
                  onClick={handleContinue}
                  disabled={!selected}
                  loading={loading}
                >
                  {loading ? "Saving…" : "Continue →"}
                </PrimaryButton>
              </div>
            </div>

            {/* RIGHT — Dynamic info panel */}
            <RightInfoPanel selectedOption={selected} />
          </div>
        </div>
      </div>

      {/*
        ── Mobile sticky footer button — fixed at bottom, only shown on mobile
        ── Mirrors the exact same disabled/loading state as the desktop button
      */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-gray-800 px-4 py-3 safe-area-pb">
        <PrimaryButton
          onClick={handleContinue}
          disabled={!selected}
          loading={loading}
          className="w-full"
        >
          {loading ? "Saving…" : "Continue →"}
        </PrimaryButton>
      </div>

      {showModal && (
        <BlockingModal
          onClose={() => setShowModal(false)}
          onDelete={handleDeleteAccount}
        />
      )}

      <SuccessToast
        message={successMsg}
        onDismiss={() => {
          setSuccessMsg(null);
          //  setSubStep(BASIC_SUB.REGISTRATION_ENTITY_TYPE);
        }}
      />
      <ErrorToast error={apiError} onDismiss={() => setApiError(null)} />
    </>
  );
}

export { BlockingPage };