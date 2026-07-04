import { useState, useEffect } from "react";
import {
  useOnboardingStore,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { verifyBank } from "@/features/onboarding/services/api/verify.api";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorModal from "@/components/common/ErrorModal";
import Input from "@/components/common/Input";

const BANK_ACCOUNT_TYPES = Object.freeze({
  SAVINGS: "SAVINGS",
  CURRENT: "CURRENT",
  NRE: "NRE",
  NRO: "NRO",
  OD: "OD",
  CC: "CC",
  OTHER: "OTHER",
});

function RuleRow({ label, passed, touched }) {
  const color = !touched ? "text-gray-400" : passed ? "text-emerald-600" : "text-red-500";
  const bg = !touched ? "bg-gray-100" : passed ? "bg-emerald-100" : "bg-red-100";
  return (
    <div className="flex items-center gap-2 transition-all duration-200">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        {!touched ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        ) : passed ? (
          <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-xs font-medium transition-colors duration-200 ${color}`}>{label}</span>
    </div>
  );
}

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 002.458 12c1.274 4.057 5.065 7 9.542 7a9.46 9.46 0 004.638-1.227" />
  </svg>
);

// ── InputField — now shows inline error message below input when touched + invalid ──
// function InputField({
//   label, placeholder, value, onChange, onFocus, onBlur,
//   touched, isValid, mono, maxLength, inputMode, required,
//   icon, showEyeToggle, revealed, onToggleReveal, errorMsg,
// }) {
//   return (
//     <div className="flex flex-col">
//       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
//         {label}
//         {required && <span className="text-red-400">*</span>}
//       </label>
//       <div className="relative">
//         {icon && (
//           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">{icon}</div>
//         )}
//         <input
//           type="text"
//           placeholder={placeholder}
//           value={value}
//           onChange={onChange}
//           onFocus={onFocus}
//           onBlur={onBlur}
//           maxLength={maxLength}
//           inputMode={inputMode}
//           className={`w-full py-2.5 bg-white border rounded-lg text-sm font-medium text-gray-800
//             ${icon ? "pl-9" : "pl-3"}
//             ${showEyeToggle ? "pr-16" : "pr-10"}
//             ${mono ? "font-mono tracking-widest" : ""}
//             placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
//             ${!touched
//               ? "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
//               : isValid
//                 ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
//                 : "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50"
//             }`}
//         />
//         {showEyeToggle && (
//           <button
//             type="button"
//             onClick={onToggleReveal}
//             tabIndex={-1}
//             className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
//           >
//             {revealed ? <EyeOffIcon /> : <EyeIcon />}
//           </button>
//         )}
//         {touched && (
//           <div className="absolute right-3 top-1/2 -translate-y-1/2">
//             {isValid ? (
//               <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
//                 <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
//                 </svg>
//               </div>
//             ) : (
//               <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
//                 <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//       {/* ── Inline error message — only when touched AND invalid ── */}
//       {touched && !isValid && errorMsg && (
//         <p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
//           <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//           </svg>
//           {errorMsg}
//         </p>
//       )}
//     </div>
//   );
// }

function AccountTypeSelect({ value, onChange, required }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        Account Type
        {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-9 py-2.5 pr-10 bg-white border rounded-lg text-sm font-medium
            outline-none transition-all duration-200 appearance-none cursor-pointer
            ${value
              ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-gray-800"
              : "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 text-gray-300"
            }`}
        >
          <option value="" disabled className="text-gray-300 font-sans">Select account type</option>
          {Object.entries(BANK_ACCOUNT_TYPES).map(([key, val]) => (
            <option key={key} value={val} className="text-gray-800 font-sans">{val}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {value ? (
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

const FIELD_RULES = {
  accountNumber: [
    { label: "Valid account number (9–18 digits)", test: (v) => /^\d{9,18}$/.test(v) },
  ],
  ifscCode: [
    { label: "Valid IFSC code (e.g. HDFC0001234)", test: (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v) },
  ],
};

// ── Inline error messages per field ──
const FIELD_ERRORS = {
  accountNumber: "Enter a valid 9–18 digit account number",
  ifscCode: "Enter a valid IFSC code (e.g. HDFC0001234)",
};

const CardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const PersonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ── Pincode extractor ──
function extractPincode(address) {
  if (!address) return null;
  const matches = address.match(/\b\d{6}\b/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

// ── Clean address — strip toll-free / junk after pincode ──
function cleanAddress(address = "") {
  if (!address || typeof address !== "string") return "";
  const cleaned = address.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/^([\s\S]*?\b\d{6}\b)/);
  return match
    ? match[1].replace(/[,\s]+$/, "")
    : cleaned.replace(/[,\s]+$/, "");
}

// ── Navigation delay — must match SuccessToast duration ──
const NAV_DELAY = 3500;

export default function Step11BankEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [fields, setFields] = useState({ accountNumber: "", ifscCode: "", beneficiaryName: "" });
  const [touched, setTouched] = useState({ accountNumber: false, ifscCode: false });
  const [accountType, setAccountType] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [revealAccount, setRevealAccount] = useState(false);
  const [accountFocused, setAccountFocused] = useState(false);
  const [ifscInfo, setIfscInfo] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscLookupError, setIfscLookupError] = useState(null);

  const normalised = {
    accountNumber: fields.accountNumber.replace(/\D/g, "").slice(0, 18),
    ifscCode: fields.ifscCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11),
    beneficiaryName: fields.beneficiaryName,
  };

  const fieldValid = {
    accountNumber: FIELD_RULES.accountNumber.every((r) => r.test(normalised.accountNumber)),
    ifscCode: FIELD_RULES.ifscCode.every((r) => r.test(normalised.ifscCode)),
  };

  const anyTouched = Object.values(touched).some(Boolean);
  const allValid = Object.values(fieldValid).every(Boolean);
  const isFormValid = allValid && !!accountType;
  const hasBeneficiaryInput = fields.beneficiaryName.trim().length > 0;
  const isBeneficiaryValid = hasBeneficiaryInput ? fields.beneficiaryName.trim().length >= 3 : true;

  const maskAccountNumber = (acc) => {
    if (!acc) return "";
    if (acc.length <= 7) return acc;
    return `${acc.slice(0, 3)}${"X".repeat(acc.length - 7)}${acc.slice(-4)}`;
  };
  const maskWhileTyping = (acc) => {
    if (!acc) return "";
    if (acc.length <= 1) return acc;
    return "X".repeat(acc.length - 1) + acc.slice(-1);
  };

  const accountDisplayValue = revealAccount
    ? normalised.accountNumber
    : accountFocused
      ? maskWhileTyping(normalised.accountNumber)
      : maskAccountNumber(normalised.accountNumber);

  const handleAccountNumberChange = (e) => {
    const newVal = e.target.value;
    const oldDisplay = accountDisplayValue;
    setFields((prev) => {
      const rawDigits = prev.accountNumber;
      if (newVal.length > oldDisplay.length) {
        const appended = newVal.slice(oldDisplay.length).replace(/\D/g, "");
        return { ...prev, accountNumber: (rawDigits + appended).slice(0, 18) };
      }
      if (newVal.length < oldDisplay.length) {
        const removedCount = oldDisplay.length - newVal.length;
        return { ...prev, accountNumber: rawDigits.slice(0, Math.max(0, rawDigits.length - removedCount)) };
      }
      return { ...prev, accountNumber: newVal.replace(/\D/g, "").slice(0, 18) };
    });
    if (!touched.accountNumber && newVal.length > 0)
      setTouched((prev) => ({ ...prev, accountNumber: true }));
    setFetchDone(false);
    setApiError(null);
  };

  const handleChange = (key) => (e) => {
    let val = e.target.value;
    if (key === "ifscCode") val = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setFields((prev) => ({ ...prev, [key]: val }));
    if (key !== "beneficiaryName" && !touched[key] && val.length > 0)
      setTouched((prev) => ({ ...prev, [key]: true }));
    setFetchDone(false);
    setApiError(null);
  };

  const handleBlur = (key) => () => {
    if (key !== "beneficiaryName" && fields[key])
      setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // ── Live IFSC lookup ──
  useEffect(() => {
    if (!fieldValid.ifscCode) {
      setIfscInfo(null); setIfscLookupError(null); setIfscLoading(false);
      return;
    }
    let cancelled = false;
    setIfscLoading(true);
    setIfscLookupError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${normalised.ifscCode}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        if (!cancelled) { setIfscInfo(data); setIfscLookupError(null); }
      } catch {
        if (!cancelled) { setIfscInfo(null); setIfscLookupError("Couldn't find bank details for this IFSC"); }
      } finally {
        if (!cancelled) setIfscLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalised.ifscCode, fieldValid.ifscCode]);

  // ── Verify ──
  const handleVerify = async () => {
    if (!isFormValid) return;
    setFetching(true);
    setApiError(null);
    setShowModal(false);

    try {
      const data = await verifyBank({
        accountNumber: normalised.accountNumber,
        ifsc: normalised.ifscCode,
        ...(normalised.beneficiaryName.trim() ? { beneficiaryName: normalised.beneficiaryName.trim() } : {}),
      });

      const bank_data = data?.data || data;
      console.log("Step11 — raw API response:", data);
      console.log("Step11 — normalised bank_data:", bank_data);

      if (!bank_data.success || bank_data.status === "FAILED") {
        const reason =
          bank_data.result?.failure_reason ||
          bank_data.message ||
          "Bank verification failed. Please check your details and try again.";
        setApiError({ humanMessage: reason, txnId: bank_data?.tranx_id || null });
        setShowModal(true);
        return;
      }

      // ── Success ──
      const cgpeyResult = bank_data.result ?? {};

      // ── Resolve bank_address: CGPEY first, Razorpay IFSC fallback ──
      let resolvedBankAddress = cgpeyResult.bank_address ?? null;

      if (!resolvedBankAddress && ifscInfo?.ADDRESS) {
        // Build structured object from Razorpay IFSC data
        resolvedBankAddress = {
          addressLine1: cleanAddress(ifscInfo.ADDRESS) || undefined,
          city: ifscInfo.CITY || undefined,
          district: ifscInfo.DISTRICT || undefined,
          state: ifscInfo.STATE || undefined,
          pinCode: extractPincode(ifscInfo.ADDRESS) || undefined,
          country: "India",
        };
      } else if (resolvedBankAddress && typeof resolvedBankAddress === "string") {
        // CGPEY returned a string address — clean and keep as-is
        resolvedBankAddress = {
          addressLine1: cleanAddress(resolvedBankAddress) || undefined,
          pinCode: extractPincode(resolvedBankAddress) || undefined,
          country: "India",
        };
      }
      // If CGPEY returned an object already, keep as-is

      const mergedResult = {
        ...cgpeyResult,
        bank_name: cgpeyResult.bank_name ?? ifscInfo?.BANK ?? null,
        bank_branch: cgpeyResult.bank_branch ?? ifscInfo?.BRANCH ?? null,
        bank_address: resolvedBankAddress,
        micr_code: cgpeyResult.micr_code ?? ifscInfo?.MICR ?? null,
      };

      useOnboardingStore.getState().setBankDetails({
        ...bank_data,
        result: mergedResult,
        enteredAccountNumber: normalised.accountNumber,
        accountType,
        // ── Raw Razorpay fields kept as safe-net fallback ──
        ifscBankName: ifscInfo?.BANK ?? null,
        ifscBranchName: ifscInfo?.BRANCH ?? null,
        ifscBankAddress: ifscInfo?.ADDRESS ?? null,
        ifscCity: ifscInfo?.CITY ?? null,
        ifscDistrict: ifscInfo?.DISTRICT ?? null,
        ifscState: ifscInfo?.STATE ?? null,
        ifscMicr: ifscInfo?.MICR ?? null,
      });

      console.log("Step11 — store bankDetails after set:", useOnboardingStore.getState().formData.bankDetails);

      if (onFetchSuccess) onFetchSuccess(bank_data);

      setFetchDone(true);
      setSuccessMsg(`Bank account ••••${normalised.accountNumber.slice(-4)} verified successfully`);

      setTimeout(() => {
        goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.BANK_READONLY);
      }, NAV_DELAY);

    } catch (err) {
      setApiError({
        humanMessage: err.message || "Bank verification failed. Please try again.",
        txnId: null,
      });
      setShowModal(true);
    } finally {
      setFetching(false);
    }
  };

  const maskedAccount = normalised.accountNumber.length > 4
    ? "••••" + normalised.accountNumber.slice(-4)
    : normalised.accountNumber;

  return (
    <>
      <SuccessToast
        message={successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={NAV_DELAY}
      />

      <ErrorModal
        error={showModal ? apiError : null}
        onDismiss={() => { setShowModal(false); setApiError(null); }}
        onRetry={() => { setShowModal(false); setApiError(null); handleVerify(); }}
        duration={5000}
      />

      <div className="max-w-3xl mx-auto">
        <style>{`
          @keyframes stepIn {
            from { opacity:0; transform:translateY(12px) scale(0.99); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          .step-in { animation: stepIn 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
        `}</style>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 step-in">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
              Enter Your Business Bank Details
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Provide your business bank account details for verification
            </p>
          </div>
        </div>

        {/* Two column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 step-in" style={{ animationDelay: "0.05s" }}>

          {/* LEFT */}
          <div className="flex flex-col gap-3.5">


            <Input
              label="Account Number"
              required
              placeholder="Enter account number"
              value={accountDisplayValue}
              onChange={handleAccountNumberChange}
              onFocus={() => setAccountFocused(true)}
              onBlur={() => { setAccountFocused(false); handleBlur("accountNumber")(); }}
              touched={touched.accountNumber}
              isValid={fieldValid.accountNumber}
              mono
              inputMode="numeric"
              maxLength={18}
              minLength={9}
              icon={<CardIcon />}
              showEyeToggle
              revealed={revealAccount}
              onToggleReveal={() => setRevealAccount(p => !p)}
              errorMsg="Enter a valid 9–18 digit account number"
            />

{/* // IFSC Code: */}
            <Input
              label="IFSC Code"
              required
              placeholder="e.g. HDFC0001234"
              value={normalised.ifscCode}
              onChange={handleChange("ifscCode")}
              onBlur={handleBlur("ifscCode")}
              touched={touched.ifscCode}
              isValid={fieldValid.ifscCode}
              mono
              maxLength={11}
              minLength={11}
              icon={<LocationIcon />}
              errorMsg="Enter a valid IFSC code (e.g. HDFC0001234)"
            />

            {/* Live IFSC bank info */}
            {(ifscLoading || ifscInfo || ifscLookupError) && (
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border -mt-1.5
                ${ifscLookupError ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                {ifscLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs text-emerald-600 font-medium">Fetching bank details…</span>
                  </>
                ) : ifscLookupError ? (
                  <span className="text-xs text-red-500 font-medium">{ifscLookupError}</span>
                ) : ifscInfo ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-800 truncate">{ifscInfo.BANK}</p>
                      <p className="text-[11px] text-emerald-500 truncate">
                        {ifscInfo.BRANCH}{ifscInfo.CITY ? `, ${ifscInfo.CITY}` : ""}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <AccountTypeSelect
              value={accountType}
              onChange={(val) => { setAccountType(val); setFetchDone(false); setApiError(null); }}
              required
            />

            {/* Optional beneficiary name */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                Account Holder Name
                <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                  <PersonIcon />
                </div>
                <input
                  type="text"
                  placeholder="Enter account holder name"
                  value={fields.beneficiaryName}
                  onChange={handleChange("beneficiaryName")}
                  maxLength={80}
                  className={`w-full pl-9 py-2.5 pr-10 bg-white border rounded-lg text-sm font-medium text-gray-800
                    placeholder:text-gray-300 placeholder:font-sans outline-none transition-all duration-200
                    ${!hasBeneficiaryInput
                      ? "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
                      : isBeneficiaryValid
                        ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                        : "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50"
                    }`}
                />
                {hasBeneficiaryInput && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isBeneficiaryValid ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Beneficiary inline error */}
              {hasBeneficiaryInput && !isBeneficiaryValid && (
                <p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Name must be at least 3 characters
                </p>
              )}
            </div>


          </div>

          {/* RIGHT — Validation checklist (unchanged) */}
          <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-4 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Validation Rules</p>
              <div className="space-y-2.5">
                {FIELD_RULES.accountNumber.map((r, i) => (
                  <RuleRow key={`acc-${i}`} label={r.label} passed={r.test(normalised.accountNumber)} touched={touched.accountNumber} />
                ))}
                {FIELD_RULES.ifscCode.map((r, i) => (
                  <RuleRow key={`ifsc-${i}`} label={r.label} passed={r.test(normalised.ifscCode)} touched={touched.ifscCode} />
                ))}
                {hasBeneficiaryInput && (
                  <RuleRow label="Account holder name (min. 3 characters)" passed={isBeneficiaryValid} touched={hasBeneficiaryInput} />
                )}
                <RuleRow label="Account type selected" passed={!!accountType} touched={!!accountType} />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100">
              Your account will be verified via penny drop. Ensure it's active and belongs to the registered business.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 step-in" style={{ animationDelay: "0.1s" }}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tips
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              "Use a business current account",
              "IFSC is printed on your cheque book",
              "Beneficiary name must match bank records exactly",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
                <span className="text-[11px] text-slate-500 leading-snug">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3 step-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex-1 min-w-0">
            {anyTouched && (normalised.accountNumber || normalised.ifscCode || fields.beneficiaryName) ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 overflow-hidden">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">Bank</span>
                <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                {normalised.accountNumber && (
                  <span className="text-sm font-mono font-bold text-gray-800 tracking-widest flex-shrink-0">{maskedAccount}</span>
                )}
                {normalised.ifscCode && (
                  <>
                    <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-gray-500 flex-shrink-0">{normalised.ifscCode}</span>
                  </>
                )}
                {accountType && (
                  <>
                    <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-blue-500 flex-shrink-0">{accountType}</span>
                  </>
                )}
                {isFormValid && (
                  <>
                    <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">✓ Valid</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-300 pl-1">Your bank details preview appears here</p>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={!isFormValid || fetching || fetchDone}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
              tracking-wide transition-all duration-200 flex-shrink-0
              ${isFormValid && !fetching && !fetchDone
                ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white shadow-sm shadow-emerald-100"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
          >
            {fetching ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Verifying…
              </>
            ) : fetchDone ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </>
            ) : (
              <>
                Verify Bank
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}