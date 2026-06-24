import { useState } from "react";
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

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
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ReviewRow = ({ label, value, showEdit = true, onSave, onNavigateTo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value ?? "");

  const handleEdit = () => {
    if (onNavigateTo) { onNavigateTo(); return; }
    setInputVal(value ?? "");
    setIsEditing(true);
  };
  const handleSave = () => { onSave?.(inputVal); setIsEditing(false); };
  const handleCancel = () => { setInputVal(value ?? ""); setIsEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 min-h-[52px]">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">{label}</p>
        {isEditing ? (
          <input autoFocus value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 text-sm
              text-gray-800 outline-none focus:ring-2 focus:ring-emerald-200 bg-emerald-50" />
        ) : (
          <p className="text-sm font-semibold text-gray-800 truncate">{value || "—"}</p>
        )}
      </div>
      {showEdit && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button onClick={handleCancel}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                <CancelIcon />
              </button>
              <button onClick={handleSave}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-white bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer">
                <SaveIcon />
              </button>
            </>
          ) : (
            <button onClick={handleEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer">
              <PenIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function BusinessDetailsReview({ onNavigate, lastStep, lastSubStep }) {
  const formData = useOnboardingStore((s) => s.formData);
  const setField = useOnboardingStore((s) => s.setField);
  const { goToStep } = useOnboardingStore();

  // Data with fallbacks
  const pan      = formData.pan      || formData.panDetails?.pan      || "—";
  const panName  = formData.panDetails?.fullName || formData.panDetails?.name || "—";
  const gstin    = formData.gstin    || formData.gstDetails?.gstNumber || "—";
  const gstName  = formData.gstDetails?.legalName || formData.gstDetails?.legal_name || "—";
  const gstDate  = formData.gstDetails?.registrationDate || formData.gstDetails?.dateOfRegistration || "—";

  const handleContinue = () => {
    if (lastStep) goToStep(lastStep, lastSubStep ?? 1);
    else goToStep(STEPS.BANK_VERIFICATION, 1);
    onNavigate?.();
  };

  const goToPANEnter = () => {
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_VERIFICATION);
    onNavigate?.();
  };

  const goToGSTEnter = () => {
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.GST_VERIFICATION);
    onNavigate?.();
  };

  return (
    <div className="w-full max-w-md mx-auto" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Heading */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Business Verification</p>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-700 leading-tight">Review /&nbsp;Edit</h1>
        <p className="text-base font-bold text-gray-400 leading-tight">Business Details</p>
      </div>

      {/* PAN Section */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-2">PAN Details</p>
      <div className="w-full bg-white px-4 divide-y divide-gray-100 rounded-xl border border-gray-100 mb-3">
        {/* PAN number — pen icon navigates to PAN enter step */}
        <ReviewRow label="PAN Number" value={pan} showEdit={true}
          onNavigateTo={goToPANEnter} />
        {/* PAN name — read only */}
        <ReviewRow label="PAN Full Name" value={panName} showEdit={false} />
      </div>

      {/* GST Section */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-3">GST Details</p>
      <div className="w-full bg-white px-4 divide-y divide-gray-100 rounded-xl border border-gray-100 mb-3">
        {/* GST number — pen icon navigates to GST enter step */}
        <ReviewRow label="GST Number" value={gstin} showEdit={true}
          onNavigateTo={goToGSTEnter} />
        <ReviewRow label="GST Legal Name" value={gstName} showEdit={false} />
        <ReviewRow label="Date of Incorporation" value={gstDate} showEdit={false} />
      </div>

      <div className="flex items-center justify-center mt-6">
        <button onClick={handleContinue}
          className="px-14 py-2.5 bg-emerald-500 rounded-xl cursor-pointer text-white
            font-semibold text-sm hover:bg-emerald-600 transition-all active:scale-[0.98]
            flex items-center gap-2">
          Continue
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}