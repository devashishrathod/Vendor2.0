import { useState } from "react";
import { useOnboardingStore, BANK_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

const BANK_ACCOUNT_TYPES = ["SAVINGS", "CURRENT", "NRE", "NRO", "OD", "CC", "OTHER"];

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

// ── Normal editable row ──
const ReviewRow = ({ label, value, showEdit = true, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value ?? "");

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
            <button onClick={() => { setInputVal(value ?? ""); setIsEditing(true); }}
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

// ── Dropdown row for Account Type ──
const DropdownRow = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(value ?? "");

  const handleSave = () => { onSave?.(selected); setIsEditing(false); };
  const handleCancel = () => { setSelected(value ?? ""); setIsEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 min-h-[52px]">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">{label}</p>
        {isEditing ? (
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-emerald-300 rounded-lg px-2.5 py-1.5 text-sm
              text-gray-800 outline-none focus:ring-2 focus:ring-emerald-200 bg-emerald-50 cursor-pointer">
            <option value="" disabled>Select type</option>
            {BANK_ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
        )}
      </div>
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
          <button onClick={() => { setSelected(value ?? ""); setIsEditing(true); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer">
            <PenIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default function BankDetailsReview({ accountType, onNavigate, lastStep, lastSubStep }) {
  const formData = useOnboardingStore((s) => s.formData);
  const setField = useOnboardingStore((s) => s.setField);
  const setBankDetails = useOnboardingStore((s) => s.setBankDetails);
  const { goToStep } = useOnboardingStore();

  // Data with fallbacks
  const bankAccount = formData.bankAccount || formData.bankDetails?.enteredAccountNumber || "—";
  const bankIfsc    = formData.bankIfsc    || formData.bankDetails?.result?.ifsc          || "—";
  const holderName  = formData.bankHolderName || formData.bankDetails?.result?.name       || "—";
  const accType     = accountType || formData.bankDetails?.accountType                    || "—";

  const handleContinue = () => {
    if (lastStep) goToStep(lastStep, lastSubStep ?? 1);
    else goToStep(STEPS.SYSTEM_VERIFY, 1);
    onNavigate?.();
  };

  const handleEditBank = () => {
    goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.BANK_VERIFICATION);
    onNavigate?.();
  };

  return (
    <div className="w-full max-w-md mx-auto" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Heading with pen icon */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Bank Verification</p>
          </div>
          {/* Header pen icon → go to bank enter step */}
          <button onClick={handleEditBank}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400
              hover:text-emerald-500 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer">
            <PenIcon />
            Edit Details
          </button>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-700 leading-tight">Review /&nbsp;Edit</h1>
        <p className="text-base font-bold text-gray-400 leading-tight">Bank Details</p>
      </div>

      {/* Rows */}
      <div className="w-full bg-white px-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
        <ReviewRow label="Bank Account Number" value={bankAccount} showEdit={true}
          onSave={(val) => {
            setField("bankAccount", val);
            setBankDetails({ ...formData.bankDetails, enteredAccountNumber: val });
          }} />

        <ReviewRow label="IFSC Code" value={bankIfsc} showEdit={true}
          onSave={(val) => {
            setField("bankIfsc", val);
            setBankDetails({ ...formData.bankDetails, result: { ...formData.bankDetails?.result, ifsc: val } });
          }} />

        <DropdownRow label="Account Type" value={accType}
          onSave={(val) => {
            setBankDetails({ ...formData.bankDetails, accountType: val });
          }} />

        <ReviewRow label="Account Holder Name" value={holderName} showEdit={false} />
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