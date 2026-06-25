import { useState, useEffect } from "react";
import {
  useOnboardingStore,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { verifyBank } from "@/features/onboarding/services/api/verify.api";

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
  const color = !touched
    ? "text-gray-400"
    : passed
      ? "text-emerald-600"
      : "text-red-500";
  const bg = !touched
    ? "bg-gray-100"
    : passed
      ? "bg-emerald-100"
      : "bg-red-100";
  return (
    <div className="flex items-center gap-2 transition-all duration-200">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}
      >
        {!touched ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        ) : passed ? (
          <svg
            className="w-2.5 h-2.5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors duration-200 ${color}`}
      >
        {label}
      </span>
    </div>
  );
}

// ── Eye icons for account number reveal/hide ──
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

function InputField({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  touched,
  isValid,
  mono,
  maxLength,
  inputMode,
  required,
  icon,
  showEyeToggle,
  revealed,
  onToggleReveal,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
            {icon}
          </div>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          maxLength={maxLength}
          inputMode={inputMode}
          className={`w-full py-2.5 bg-white border rounded-lg text-sm font-medium text-gray-800
            ${icon ? "pl-9" : "pl-3"}
            ${showEyeToggle ? "pr-16" : "pr-10"}
            ${mono ? "font-mono tracking-widest" : ""}
            placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
            ${
              !touched
                ? "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
                : isValid
                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                  : "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50"
            }`}
        />

        {showEyeToggle && (
          <button
            type="button"
            onClick={onToggleReveal}
            tabIndex={-1}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
            ${
              value
                ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-gray-800"
                : "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 text-gray-300"
            }`}
        >
          <option value="" disabled className="text-gray-300 font-sans">
            Select account type
          </option>
          {Object.entries(BANK_ACCOUNT_TYPES).map(([key, val]) => (
            <option key={key} value={val} className="text-gray-800 font-sans">
              {val}
            </option>
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

// Only validate required fields — account number and IFSC
const FIELD_RULES = {
  accountNumber: [
    {
      label: "Valid account number (9–18 digits)",
      test: (v) => /^\d{9,18}$/.test(v),
    },
  ],
  ifscCode: [
    {
      label: "Valid IFSC code (e.g. HDFC0001234)",
      test: (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v),
    },
  ],
};

// Icon components
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PersonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function Step11BankEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [fields, setFields] = useState({
    accountNumber: "",
    ifscCode: "",
    beneficiaryName: "",
  });
  const [touched, setTouched] = useState({
    accountNumber: false,
    ifscCode: false,
  });
  const [accountType, setAccountType] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── Account number reveal/mask ──
  const [revealAccount, setRevealAccount] = useState(false);
  const [accountFocused, setAccountFocused] = useState(false);

  // ── IFSC live bank lookup (Razorpay IFSC API) ──
  const [ifscInfo, setIfscInfo] = useState(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscLookupError, setIfscLookupError] = useState(null);

  const normalised = {
    accountNumber: fields.accountNumber.replace(/\D/g, "").slice(0, 18),
    ifscCode: fields.ifscCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11),
    beneficiaryName: fields.beneficiaryName,
  };

  const fieldValid = {
    accountNumber: FIELD_RULES.accountNumber.every((r) =>
      r.test(normalised.accountNumber),
    ),
    ifscCode: FIELD_RULES.ifscCode.every((r) => r.test(normalised.ifscCode)),
  };

  const anyTouched = Object.values(touched).some(Boolean);
  const allValid = Object.values(fieldValid).every(Boolean);

  const isFormValid = allValid && !!accountType;

  const hasBeneficiaryInput = fields.beneficiaryName.trim().length > 0;
  const isBeneficiaryValid = hasBeneficiaryInput
    ? fields.beneficiaryName.trim().length >= 3
    : true;

  // ── Mask account number: first 3 + X's + last 4 ──
  const maskAccountNumber = (acc) => {
    if (!acc) return "";
    if (acc.length <= 7) return acc;
    const first3 = acc.slice(0, 3);
    const last4 = acc.slice(-4);
    return `${first3}${"X".repeat(acc.length - 7)}${last4}`;
  };

  const accountDisplayValue =
    revealAccount || accountFocused
      ? normalised.accountNumber
      : maskAccountNumber(normalised.accountNumber);

  const handleChange = (key) => (e) => {
    let val = e.target.value;
    if (key === "accountNumber") val = val.replace(/\D/g, "").slice(0, 18);
    if (key === "ifscCode")
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setFields((prev) => ({ ...prev, [key]: val }));

    if (key !== "beneficiaryName") {
      if (!touched[key] && val.length > 0)
        setTouched((prev) => ({ ...prev, [key]: true }));
    }
    setFetchDone(false);
    setApiError(null);
  };

  const handleBlur = (key) => () => {
    if (key !== "beneficiaryName" && fields[key])
      setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // ── Live IFSC → bank name / branch lookup ──
  useEffect(() => {
    if (!fieldValid.ifscCode) {
      setIfscInfo(null);
      setIfscLookupError(null);
      setIfscLoading(false);
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
        if (!cancelled) {
          setIfscInfo(data);
          setIfscLookupError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setIfscInfo(null);
          setIfscLookupError("Couldn't find bank details for this IFSC");
        }
      } finally {
        if (!cancelled) setIfscLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalised.ifscCode, fieldValid.ifscCode]);

  const handleVerify = async () => {
    if (!isFormValid) return;

    setFetching(true);
    setApiError(null);
    try {
      const data = await verifyBank({
        accountNumber: normalised.accountNumber,
        ifsc: normalised.ifscCode,
        ...(normalised.beneficiaryName.trim()
          ? { beneficiaryName: normalised.beneficiaryName.trim() }
          : {}),
      });

      const bank_data = data?.data || data;

      console.log("Step11 — raw API response:", data);
      console.log("Step11 — normalised bank_data:", bank_data);

      if (!bank_data.success || bank_data.status === "FAILED") {
        const reason =
          bank_data.result?.failure_reason ||
          bank_data.message ||
          "Bank verification failed. Please check your details and try again.";
        setApiError(reason);
        return;
      }

      setFetchDone(true);

      useOnboardingStore.getState().setBankDetails({
        ...bank_data,
        enteredAccountNumber: normalised.accountNumber,
        accountType: accountType,
        // ── bank name/branch/address fetched live via IFSC lookup ──
        ifscBankName: ifscInfo?.BANK || null,
        ifscBranchName: ifscInfo?.BRANCH || null,
        ifscBankAddress: ifscInfo?.ADDRESS || null,
        ifscCity: ifscInfo?.CITY || null,
        ifscDistrict: ifscInfo?.DISTRICT || null,
        ifscState: ifscInfo?.STATE || null,
      });

      console.log(
        "Step11 — store bankDetails after set:",
        useOnboardingStore.getState().formData.bankDetails,
      );

      if (onFetchSuccess) onFetchSuccess(bank_data);
      goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.BANK_READONLY);
    } catch (err) {
      setApiError(err.message || "Bank verification failed. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const maskedAccount =
    normalised.accountNumber.length > 4
      ? "••••" + normalised.accountNumber.slice(-4)
      : normalised.accountNumber;

  return (
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
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 step-in"
        style={{ animationDelay: "0.05s" }}
      >
        {/* LEFT */}
        <div className="flex flex-col gap-3.5">
          <InputField
            label="Account Number"
            placeholder="Enter account number"
            value={accountDisplayValue}
            onChange={handleChange("accountNumber")}
            onFocus={() => setAccountFocused(true)}
            onBlur={() => {
              setAccountFocused(false);
              handleBlur("accountNumber")();
            }}
            touched={touched.accountNumber}
            isValid={fieldValid.accountNumber}
            mono
            maxLength={18}
            inputMode="numeric"
            required
            icon={<CardIcon />}
            showEyeToggle
            revealed={revealAccount}
            onToggleReveal={() => setRevealAccount((p) => !p)}
          />

          <InputField
            label="IFSC Code"
            placeholder="e.g. HDFC0001234"
            value={normalised.ifscCode}
            onChange={handleChange("ifscCode")}
            onBlur={handleBlur("ifscCode")}
            touched={touched.ifscCode}
            isValid={fieldValid.ifscCode}
            mono
            maxLength={11}
            required
            icon={<LocationIcon />}
          />

          {/* ── Live bank name/branch from IFSC ── */}
          {(ifscLoading || ifscInfo || ifscLookupError) && (
            <div
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border -mt-1.5 ${
                ifscLookupError
                  ? "bg-red-50 border-red-100"
                  : "bg-emerald-50 border-emerald-100"
              }`}
            >
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-800 truncate">{ifscInfo.BANK}</p>
                    <p className="text-[11px] text-emerald-500 truncate">
                      {ifscInfo.BRANCH}
                      {ifscInfo.CITY ? `, ${ifscInfo.CITY}` : ""}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <AccountTypeSelect
            value={accountType}
            onChange={(val) => {
              setAccountType(val);
              setFetchDone(false);
              setApiError(null);
            }}
            required
          />

          {/* Optional field — no validation, no touched tracking, no effect on isFormValid */}
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
                  ${
                    !hasBeneficiaryInput
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
          </div>

          {anyTouched && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-200
              ${isFormValid ? "bg-emerald-50 border-emerald-100" : "bg-red-50/60 border-red-100"}`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${isFormValid ? "bg-emerald-500" : "bg-red-400"}`}
              >
                {isFormValid ? (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold ${isFormValid ? "text-emerald-700" : "text-red-600"}`}>
                  {isFormValid ? "Valid Details" : "Invalid Details"}
                </p>
                <p className={`text-[11px] mt-0.5 ${isFormValid ? "text-emerald-500" : "text-red-400"}`}>
                  {isFormValid
                    ? "All validations passed. Ready to verify."
                    : "Fix the errors on the right to continue."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Validation checklist */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Validation Rules
            </p>
            <div className="space-y-2.5">
              {FIELD_RULES.accountNumber.map((r, i) => (
                <RuleRow
                  key={`acc-${i}`}
                  label={r.label}
                  passed={r.test(normalised.accountNumber)}
                  touched={touched.accountNumber}
                />
              ))}
              {FIELD_RULES.ifscCode.map((r, i) => (
                <RuleRow
                  key={`ifsc-${i}`}
                  label={r.label}
                  passed={r.test(normalised.ifscCode)}
                  touched={touched.ifscCode}
                />
              ))}

              {hasBeneficiaryInput && (
                <RuleRow
                  label="Account holder name (min. 3 characters)"
                  passed={isBeneficiaryValid}
                  touched={hasBeneficiaryInput}
                />
              )}

              <RuleRow
                label="Account type selected"
                passed={!!accountType}
                touched={!!accountType}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100">
            Your account will be verified via penny drop. Ensure it's active and
            belongs to the registered business.
          </p>
        </div>
      </div>

      {/* Tips */}
      <div
        className="bg-blue-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 step-in"
        style={{ animationDelay: "0.1s" }}
      >
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

      {/* API Error */}
      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* CTA row */}
      <div
        className="flex items-center gap-3 step-in"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="flex-1 min-w-0">
          {anyTouched &&
          (normalised.accountNumber || normalised.ifscCode || fields.beneficiaryName) ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 overflow-hidden">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">
                Bank
              </span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
              {normalised.accountNumber && (
                <span className="text-sm font-mono font-bold text-gray-800 tracking-widest flex-shrink-0">
                  {maskedAccount}
                </span>
              )}
              {normalised.ifscCode && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-gray-500 flex-shrink-0">
                    {normalised.ifscCode}
                  </span>
                </>
              )}
              {accountType && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-blue-500 flex-shrink-0">
                    {accountType}
                  </span>
                </>
              )}
              {isFormValid && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">
                    ✓ Valid
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">
              Your bank details preview appears here
            </p>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={!isFormValid || fetching || fetchDone}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${
              isFormValid && !fetching && !fetchDone
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
  );
}