import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateBankDetails } from '../validation';
import { useOnboardingStore, BANK_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Shared: PrimaryButton ────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '', variant = 'emerald' }) {
  const base = 'w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2';
  const styles = {
    emerald: disabled || loading
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98] shadow-sm shadow-emerald-200',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant]} ${className}`}>
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Field validation rules ───────────────────────────────────────────────────
const FIELD_RULES = {
  accountNumber: [
    { label: 'Valid account number (9–18 digits)', test: v => /^\d{9,18}$/.test(v) },
  ],
  ifsc: [
    { label: 'Valid IFSC code (e.g. HDFC0001234)', test: v => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v) },
  ],
  accountHolderName: [
    { label: 'Account holder name required', test: v => v.trim().length >= 3 },
  ],
};

// ── Validation Rule Row ──────────────────────────────────────────────────────
function RuleRow({ label, passed, touched }) {
  const color = !touched ? 'text-gray-400' : passed ? 'text-emerald-600' : 'text-red-500';
  const bg    = !touched ? 'bg-gray-100'   : passed ? 'bg-emerald-100'   : 'bg-red-100';
  return (
    <div className="flex items-center gap-2 transition-all duration-200">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        {!touched ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
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

// ── Text Input Field ─────────────────────────────────────────────────────────
function InputField({ label, placeholder, value, onChange, onBlur, touched, isValid, mono, maxLength, inputMode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          inputMode={inputMode}
          className={`w-full px-4 py-3 pr-10 bg-white border-2 rounded-xl text-sm font-semibold text-gray-800
            ${mono ? 'font-mono tracking-widest' : ''}
            placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
            ${!touched
              ? 'border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
              : isValid
                ? 'border-emerald-400 ring-2 ring-emerald-100'
                : 'border-red-300 ring-2 ring-red-100'
            }`}
        />
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ type }) {
  if (type === 'valid') return (
    <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold text-emerald-700">Valid Details</p>
        <p className="text-xs text-emerald-600 mt-0.5">All validations passed · Verify button enabled</p>
      </div>
    </div>
  );

  if (type === 'invalid') return (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold text-red-600">Invalid Details</p>
        <p className="text-xs text-red-500 mt-0.5">Fix the flagged issues in the checklist</p>
      </div>
    </div>
  );

  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Step11BankEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [fields, setFields] = useState({
    accountNumber:     '',
    ifsc:              '',
    accountHolderName: '',
  });
  const [touched, setTouched] = useState({
    accountNumber:     false,
    ifsc:              false,
    accountHolderName: false,
  });
  const [fetching, setFetching]   = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  const normalised = {
    accountNumber:     fields.accountNumber.replace(/\D/g, '').slice(0, 18),
    ifsc:              fields.ifsc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11),
    accountHolderName: fields.accountHolderName,
  };

  const fieldValid = {
    accountNumber:     FIELD_RULES.accountNumber.every(r => r.test(normalised.accountNumber)),
    ifsc:              FIELD_RULES.ifsc.every(r => r.test(normalised.ifsc)),
    accountHolderName: FIELD_RULES.accountHolderName.every(r => r.test(normalised.accountHolderName)),
  };

  const anyTouched  = Object.values(touched).some(Boolean);
  const allValid    = Object.values(fieldValid).every(Boolean);
  const errors      = validateBankDetails(normalised);
  const isFormValid = !errors && allValid;

  const handleChange = (key) => (e) => {
    let val = e.target.value;
    if (key === 'accountNumber') val = val.replace(/\D/g, '').slice(0, 18);
    if (key === 'ifsc')          val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setFields(prev => ({ ...prev, [key]: val }));
    if (!touched[key] && val.length > 0) setTouched(prev => ({ ...prev, [key]: true }));
    setFetchDone(false);
  };

  const handleBlur = (key) => () => {
    if (fields[key]) setTouched(prev => ({ ...prev, [key]: true }));
  };

  const handleVerify = async () => {
    if (!isFormValid) return;
    setFetching(true);
    // TODO: replace with real API call
    // const res = await fetch('/api/bank/verify', { method:'POST', body: JSON.stringify(normalised) });
    // const data = await res.json();
    await new Promise(r => setTimeout(r, 1500));
    setFetching(false);
    setFetchDone(true);
    if (onFetchSuccess) onFetchSuccess(normalised);
    else goToStep(STEPS.BANK_VERIFICATION,  BANK_SUB.READONLY );
  };

  const bannerType = !anyTouched ? null : isFormValid ? 'valid' : 'invalid';

  return (
    <div className=" flex flex-col items-center justify-center ">

  
      {/* Horizontal card */}
      <div
        className="w-full max-w-3xl overflow-hidden"
        style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── LEFT: Input fields ── */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Enter Bank Account Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">Provide your business bank account details</p>
              </div>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <InputField
                label="Account Number"
                placeholder="Enter account number"
                value={normalised.accountNumber}
                onChange={handleChange('accountNumber')}
                onBlur={handleBlur('accountNumber')}
                touched={touched.accountNumber}
                isValid={fieldValid.accountNumber}
                mono
                maxLength={18}
                inputMode="numeric"
              />
              <InputField
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={normalised.ifsc}
                onChange={handleChange('ifsc')}
                onBlur={handleBlur('ifsc')}
                touched={touched.ifsc}
                isValid={fieldValid.ifsc}
                mono
                maxLength={11}
              />
              <InputField
                label="Account Holder Name"
                placeholder="Enter account holder name"
                value={fields.accountHolderName}
                onChange={handleChange('accountHolderName')}
                onBlur={handleBlur('accountHolderName')}
                touched={touched.accountHolderName}
                isValid={fieldValid.accountHolderName}
                maxLength={80}
              />
            </div>

            {/* Status banner */}
            {anyTouched && (
              <StatusBanner type={bannerType} />
            )}

            {/* Verify CTA — pushed to bottom */}
            <div className="mt-auto pt-2">
              <PrimaryButton onClick={handleVerify} disabled={!isFormValid || fetchDone} loading={fetching}>
                {fetching ? 'Verifying Details…' : fetchDone ? '✓ Details Verified' : 'Verify Bank Details'}
              </PrimaryButton>
            </div>
          </div>

          {/* ── RIGHT: Validation checklist ── */}
          <div className="p-7 bg-gray-50/50 flex flex-col gap-4">

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Validation Checklist
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
                {FIELD_RULES.ifsc.map((r, i) => (
                  <RuleRow
                    key={`ifsc-${i}`}
                    label={r.label}
                    passed={r.test(normalised.ifsc)}
                    touched={touched.ifsc}
                  />
                ))}
                {FIELD_RULES.accountHolderName.map((r, i) => (
                  <RuleRow
                    key={`name-${i}`}
                    label={r.label}
                    passed={r.test(fields.accountHolderName)}
                    touched={touched.accountHolderName}
                  />
                ))}
                {/* API-only checks — always pending until API resolves */}
                <RuleRow label="Account not found" passed={false} touched={false} />
                <RuleRow label="Name mismatch"     passed={false} touched={false} />
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                Your bank account will be verified via penny drop. Ensure the account is active and belongs to the registered business entity.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}