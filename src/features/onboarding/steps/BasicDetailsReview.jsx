import { useState } from "react";
import { useOnboardingStore, BASIC_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { validateBusinessName, validateShortName } from "@/features/onboarding/validation/index";

const PenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CancelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// validator prop — optional function jo string le ke error string ya null return kare
const ReviewRow = ({ label, value, showEdit = true, onSave, onNavigate, validator }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value ?? "");
  const [error, setError] = useState(null);

  const handleEdit = () => {
    if (onNavigate) { onNavigate(); return; }
    setInputVal(value ?? "");
    setError(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (validator) {
      const err = validator(inputVal);
      if (err) { setError(err); return; }
    }
    onSave(inputVal);
    setError(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputVal(value ?? "");
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0 min-h-[52px]">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">{label}</p>
        {isEditing ? (
          <>
            <input
              autoFocus
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); if (error) setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              className={`w-full border rounded-lg px-2.5 py-1.5 text-sm
                text-gray-800 outline-none transition-all
                ${error
                  ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100 focus:border-red-400"
                  : "border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                }`}
            />
            {error && (
              <p className="text-[10px] text-red-500 mt-1 leading-tight">{error}</p>
            )}
          </>
        ) : (
          <p className="text-sm font-semibold text-gray-800 truncate">{value || "—"}</p>
        )}
      </div>

      {showEdit && (
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {isEditing ? (
            <>
              <button onClick={handleCancel}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer">
                <CancelIcon />
              </button>
              <button onClick={handleSave}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-white bg-emerald-500 hover:bg-emerald-600 transition-all duration-150 cursor-pointer">
                <SaveIcon />
              </button>
            </>
          ) : (
            <button onClick={handleEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all duration-150 cursor-pointer"
              title={`Edit ${label}`}>
              <PenIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function BasicDetailsReview({ onNavigate }) {
  const formData = useOnboardingStore((s) => s.formData);
  const setField = useOnboardingStore((s) => s.setField);
  const goToStep = useOnboardingStore((s) => s.goToStep);

  return (
    <div className="w-full max-w-md mx-auto" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Heading — compact */}
      <div className="mb-4 mt-[-16px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Basic Details</p>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-700 leading-tight">Review /&nbsp;Edit</h1>
        <p className="text-base font-bold text-gray-400 leading-tight">Business Details</p>
      </div>

      {/* Rows */}
      <div className="w-full bg-white px-4 divide-y divide-gray-100">

        {/* Business Number — read only */}
        <ReviewRow
          label="Business Number"
          value={formData.businessPhone ?? "9555364895"}
          showEdit={false}
        />

        {/* Legal Business Name — editable + validated */}
        <ReviewRow
          label="Legal Business Name"
          value={formData.businessName}
          showEdit={true}
          validator={validateBusinessName}
          onSave={(val) => setField("businessName", val)}
        />

        {/* Short Name — editable + validated */}
        <ReviewRow
          label="Short Name"
          value={formData.shortName}
          showEdit={true}
          validator={validateShortName}
          onSave={(val) => setField("shortName", val)}
        />

        {/* Business Type — read only */}
        <ReviewRow
          label="Business Type"
          value={
            formData.isRegistered === true  ? "Registered"
            : formData.isRegistered === false ? "Not Registered"
            : "Registered"
          }
          showEdit={false}
        />

        {/* Business Entity — navigate to entity type step */}
        <ReviewRow
          label="Business Entity"
          value={formData.businessType}
          showEdit={true}
          onNavigate={() => {
            goToStep(STEPS.BASIC_DETAILS, BASIC_SUB.REGISTRATION_ENTITY_TYPE);
            onNavigate?.();
          }}
        />
      </div>

      <div className="flex items-center justify-center mt-6">
        <button className="px-14 py-2 bg-emerald-500 rounded-xl cursor-pointer text-white font-semibold text-sm hover:bg-emerald-600 transition-all">
          Continue
        </button>
      </div>
    </div>
  );
}