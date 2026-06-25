import { useState } from "react";
import {
  useOnboardingStore,
  BIZ_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { updateBusinessEntityType } from "@/features/onboarding/services/api/brand.api";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorToast from "@/components/common/ErrorToast";

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`py-2.5 px-5 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${
          disabled || loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]"
        } ${className}`}
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

const ENTITY_TYPE_MAP = {
  pvt_ltd: "PRIVATE_LIMITED",
  llp: "LLP",
  partnership: "PARTNERSHIP",
  proprietorship: "PROPRIETORSHIP",
  others: "TRUST",
};

const BUSINESS_TYPES = [
  {
    id: "pvt_ltd",
    label: "Pvt. Ltd.",
    description: "Private Limited Company",
    badge: "Most Popular",
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-emerald-600" : "text-gray-400"}`}
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
    ),
  },
  {
    id: "llp",
    label: "LLP",
    description: "Limited Liability Partnership",
    badge: null,
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-emerald-600" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "partnership",
    label: "Partnership",
    description: "General Partnership Firm",
    badge: null,
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-emerald-600" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    id: "proprietorship",
    label: "Proprietorship",
    description: "Sole Proprietorship Business",
    badge: null,
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-emerald-600" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: "others",
    label: "Others",
    description: "Trust, Society, NGO, etc.",
    badge: null,
    icon: (active) => (
      <svg
        className={`w-5 h-5 transition-colors ${active ? "text-emerald-600" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// ── Static icons used inside the right info panel ─────────────────────────────
const FeatureIcon = {
  shield: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  badge: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  coins: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 8c-3.31 0-6 1.343-6 3s2.69 3 6 3 6-1.343 6-3-2.69-3-6-3zm0 12c-3.31 0-6-1.343-6-3v-3c0 1.657 2.69 3 6 3s6-1.343 6-3v3c0 1.657-2.69 3-6 3z"
      />
    </svg>
  ),
  doc: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12h6m-6 4h6M9 8h1M5 21h14a2 2 0 002-2V8.414a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0014.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z"
      />
    </svg>
  ),
  users: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  user: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  heart: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// ── Per-entity-type info shown on the right panel ──────────────────────────────
const ENTITY_INFO = {
  pvt_ltd: {
    title: "Private Limited Company",
    description:
      "A private limited company is a separate legal entity with limited liability and more credibility.",
    features: [
      { icon: "shield", title: "Limited Liability", desc: "Shareholders' liability is limited to their investment." },
      { icon: "badge", title: "Better Credibility", desc: "Builds trust with customers, partners and investors." },
      { icon: "coins", title: "Funding Friendly", desc: "Easier to raise funds from banks and investors." },
      { icon: "doc", title: "GST Compatible", desc: "Easily apply for GST and issue tax invoices." },
    ],
    documents: ["PAN Card", "GST Number", "CIN (MCA)", "MOA & AOA"],
  },
  llp: {
    title: "Limited Liability Partnership",
    description:
      "An LLP combines the flexibility of a partnership with limited liability protection for its partners.",
    features: [
      { icon: "shield", title: "Limited Liability", desc: "Partners' liability is limited to their contribution." },
      { icon: "users", title: "Easy to Manage", desc: "Less compliance burden than a private company." },
      { icon: "coins", title: "Flexible Capital", desc: "No minimum capital requirement to get started." },
      { icon: "doc", title: "GST Compatible", desc: "Easily apply for GST and issue tax invoices." },
    ],
    documents: ["PAN Card", "GST Number", "LLPIN (MCA)", "LLP Agreement"],
  },
  partnership: {
    title: "General Partnership Firm",
    description:
      "A partnership firm is owned and run by two or more people who share profits, losses and responsibilities.",
    features: [
      { icon: "users", title: "Shared Ownership", desc: "Run jointly by two or more partners." },
      { icon: "coins", title: "Simple Setup", desc: "Quick and low-cost to register and operate." },
      { icon: "doc", title: "Easy Compliance", desc: "Fewer regulatory filings compared to companies." },
      { icon: "badge", title: "Shared Resources", desc: "Combine skills and capital with your partners." },
    ],
    documents: ["PAN Card", "GST Number", "Partnership Deed", "Address Proof"],
  },
  proprietorship: {
    title: "Sole Proprietorship Business",
    description:
      "Owned and managed by a single person — the simplest way to start and run a small business.",
    features: [
      { icon: "user", title: "Full Control", desc: "You make all the decisions for your business." },
      { icon: "coins", title: "Low Cost Setup", desc: "Minimal registration cost and paperwork." },
      { icon: "doc", title: "Simple Taxation", desc: "Income taxed as your personal income." },
      { icon: "badge", title: "Quick to Start", desc: "Get up and running in just a few days." },
    ],
    documents: ["PAN Card", "GST Number", "Address Proof", "Bank Statement"],
  },
  others: {
    title: "Trust, Society, NGO & more",
    description:
      "For non-profit and special-purpose organizations such as trusts, societies and NGOs.",
    features: [
      { icon: "heart", title: "Social Purpose", desc: "Built for charitable and welfare activities." },
      { icon: "shield", title: "Legal Recognition", desc: "Registered under applicable trust/society laws." },
      { icon: "doc", title: "Tax Benefits", desc: "May be eligible for tax exemptions." },
      { icon: "users", title: "Governed by Members", desc: "Managed by trustees, members or a board." },
    ],
    documents: ["PAN Card", "Registration Cert.", "Trust Deed", "Address Proof"],
  },
};

// ── Compact Type Card ──────────────────────────────────────────────────────────
function TypeCard({ type, selected, onClick }) {
  const isActive = selected === type.id;
  return (
    <button
      onClick={() => onClick(type.id)}
      className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border
        transition-all duration-200 w-full text-left
        ${
          isActive
            ? "border-2 border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-100"
            : "border border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50/50"
        }`}
    >
      <div className="flex items-start justify-between w-full">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200
          ${isActive ? "bg-emerald-100" : "bg-gray-100"}`}
        >
          {type.icon(isActive)}
        </div>
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${isActive ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"}`}
        >
          {isActive && <div className="w-1 h-1 rounded-full bg-white" />}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span
          className={`text-[13px] font-semibold leading-tight transition-colors duration-200
          ${isActive ? "text-emerald-700" : "text-gray-800"}`}
        >
          {type.label}
        </span>
        <p className="text-[10px] text-gray-400 leading-tight">
          {type.description}
        </p>
      </div>

      {type.badge && (
        <span
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200
          ${isActive ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"}`}
        >
          {type.badge}
        </span>
      )}
    </button>
  );
}

// ── Illustration ──────────────────────────────────────────────────────────────
function CompanyIllustration() {
  return (
    <svg viewBox="0 0 320 170" className="w-full h-auto">
      <rect width="320" height="170" rx="14" fill="#eef6f1" />
      <circle cx="270" cy="35" r="20" fill="#dff1e6" />
      <circle cx="50" cy="30" r="12" fill="#dff1e6" />
      {/* trees */}
      <g>
        <rect x="22" y="100" width="4" height="30" fill="#34d399" />
        <circle cx="24" cy="95" r="14" fill="#6ee7b7" />
        <rect x="284" y="95" width="4" height="35" fill="#34d399" />
        <circle cx="286" cy="88" r="16" fill="#6ee7b7" />
      </g>
      {/* building */}
      <g transform="translate(95,30)">
        <rect width="100" height="105" rx="6" fill="#0f9d6e" />
        <rect width="100" height="105" rx="6" fill="#10b981" opacity="0.92" />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 4 }).map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={10 + c * 22}
              y={12 + r * 18}
              width="14"
              height="11"
              rx="1.5"
              fill="#a7f3d0"
              opacity={r === 4 ? 0 : 0.9}
            />
          ))
        )}
        <rect x="36" y="80" width="28" height="25" rx="2" fill="#065f46" />
      </g>
      {/* registration card */}
      <g transform="translate(150,18)">
        <rect width="92" height="58" rx="8" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
        <text x="46" y="20" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#10b981">
          COMPANY
        </text>
        <text x="46" y="29" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#10b981">
          REGISTRATION
        </text>
        <rect x="10" y="36" width="50" height="5" rx="2" fill="#a7f3d0" />
        <rect x="10" y="45" width="34" height="5" rx="2" fill="#a7f3d0" />
        <circle cx="76" cy="42" r="11" fill="#10b981" />
        <path
          d="M71 42l3 3 7-7"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="60" cy="150" r="8" fill="#a7f3d0" opacity="0.7" />
      <circle cx="300" cy="145" r="6" fill="#6ee7b7" opacity="0.8" />
    </svg>
  );
}

// ── Dynamic right info panel ───────────────────────────────────────────────────
function RightInfoPanel({ info }) {
  return (
    <div className="w-full md:w-[270px] mt-[-85px]   flex-shrink-0 flex flex-col gap-3">
      <div className="rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50/40 p-2">
        <CompanyIllustration />
      </div>

      <div className=" flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-semibold text-gray-800">
            {info.title}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 leading-snug">
            {info.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {info.features.map((f, i) => (
            <div
              key={i}
              className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-2 flex flex-col gap-1"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                {FeatureIcon[f.icon]}
              </div>
              <p className="text-[10.5px] font-semibold text-gray-700 leading-tight">
                {f.title}
              </p>
              <p className="text-[9.5px] text-gray-400 leading-snug">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-gray-500 mb-1.5">
            Commonly Required Documents
          </p>
          <div className="flex flex-wrap gap-1.5">
            {info.documents.map((d, i) => (
              <span
                key={i}
                className="text-[9.5px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step5BusinessType() {
  const { goToStep } = useOnboardingStore();
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleContinue = async () => {
    if (!selected) return;
    const entityType = ENTITY_TYPE_MAP[selected];
    setLoading(true);
    setApiError(null);
    setSuccessMsg(null);
    try {
      await updateBusinessEntityType({ entityType });
      useOnboardingStore.getState().setField("businessType", selected);
      setSuccessMsg("Business type saved successfully!");

      setTimeout(() => {
        goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_VERIFICATION);
      }, 3000); // toast dikhne ka time
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = BUSINESS_TYPES.find((t) => t.id === selected);
  const info = ENTITY_INFO[selected] || ENTITY_INFO.pvt_ltd;

  return (
    <div className="flex items-center justify-center p-4">
      <SuccessToast
        message={successMsg}
        onDismiss={() => setSuccessMsg(null)}
      />
      <ErrorToast error={apiError} onDismiss={() => setApiError(null)} />

      <div className="w-full max-w-6xl">
        <div className="">
          <div className="flex flex-col md:flex-row gap-5 mt-14">
            {/* LEFT — Main content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-0.5">
                    Select your business type
                  </h2>
                  <p className="text-xs text-gray-400">
                    Please select your business structure to continue
                  </p>
                </div>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                {BUSINESS_TYPES.slice(0, 3).map((type) => (
                  <TypeCard
                    key={type.id}
                    type={type}
                    selected={selected}
                    onClick={(id) => {
                      setSelected(id);
                      setApiError(null);
                      setSuccessMsg(null);
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {BUSINESS_TYPES.slice(3).map((type) => (
                  <TypeCard
                    key={type.id}
                    type={type}
                    selected={selected}
                    onClick={(id) => {
                      setSelected(id);
                      setApiError(null);
                      setSuccessMsg(null);
                    }}
                  />
                ))}
              </div>

              {/* Selected summary */}
              <div
                className={`mb-3 transition-all duration-300 overflow-hidden ${selected ? "max-h-14 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2">
                  <svg
                    className="w-4 h-4 text-emerald-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-xs font-medium text-emerald-700">
                    Selected:{" "}
                    <span className="font-semibold">{selectedType?.label}</span>
                    {selectedType && (
                      <span className="text-emerald-500">
                        {" "}
                        — {selectedType.description}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
               
               
                <PrimaryButton
                  onClick={handleContinue}
                  disabled={!selected}
                  loading={loading}
                >
                  {loading ? "Saving…" : "Continue →"}
                </PrimaryButton>
              </div>
            </div>

            {/* RIGHT — Image + dynamic info panel */}
            <RightInfoPanel info={info} />
          </div>
        </div>
      </div>
    </div>
  );
}