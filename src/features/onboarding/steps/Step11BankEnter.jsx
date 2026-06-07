import { useState } from 'react';
import { validateBankDetails } from '../validation';
import { useOnboardingStore, BANK_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

function RuleRow({ label, passed, touched }) {
  const color = !touched ? 'text-gray-400' : passed ? 'text-emerald-600' : 'text-red-500';
  const bg    = !touched ? 'bg-gray-100'   : passed ? 'bg-emerald-100'   : 'bg-red-100';
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

function InputField({ label, placeholder, value, onChange, onBlur, touched, isValid, mono, maxLength, inputMode, required }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          inputMode={inputMode}
          className={`w-full px-4 py-3 pr-10 bg-white border rounded-xl text-sm font-semibold text-gray-800
            ${mono ? 'font-mono tracking-widest' : ''}
            placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal outline-none transition-all duration-200
            ${!touched
              ? 'border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50'
              : isValid
                ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
                : 'border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50'
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

const FIELD_RULES = {
  accountNumber: [
    { label: 'Valid account number (9–18 digits)', test: v => /^\d{9,18}$/.test(v) },
  ],
  ifsc: [
    { label: 'Valid IFSC code (e.g. HDFC0001234)', test: v => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v) },
  ],
  accountHolderName: [
    { label: 'Account holder name (min 3 chars)', test: v => v.trim().length >= 3 },
  ],
};

export default function Step11BankEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [fields, setFields] = useState({
    accountNumber: '', ifsc: '', accountHolderName: '',
  });
  const [touched, setTouched] = useState({
    accountNumber: false, ifsc: false, accountHolderName: false,
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
    await new Promise(r => setTimeout(r, 1500));
    setFetching(false);
    setFetchDone(true);
    if (onFetchSuccess) onFetchSuccess(normalised);
    else goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.READONLY);
  };

  const bannerType = !anyTouched ? null : isFormValid ? 'valid' : 'invalid';

  // Preview: masked account number
  const maskedAccount = normalised.accountNumber.length > 4
    ? '••••' + normalised.accountNumber.slice(-4)
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

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8 step-in">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100
          flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
            Enter Bank Account Details
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Provide your business bank account details for verification
          </p>
        </div>
      </div>

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 step-in" style={{ animationDelay: '0.05s' }}>

        {/* LEFT — Inputs */}
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
            required
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
            required
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
            required
          />

          {/* Status banner */}
          {anyTouched && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
              ${isFormValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50/60 border-red-100'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${isFormValid ? 'bg-emerald-500' : 'bg-red-400'}`}>
                {isFormValid ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold ${isFormValid ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isFormValid ? 'Valid Details' : 'Invalid Details'}
                </p>
                <p className={`text-[11px] mt-0.5 ${isFormValid ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isFormValid
                    ? 'All validations passed. Ready to verify.'
                    : 'Fix the errors on the right to continue.'}
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
                <RuleRow key={`acc-${i}`} label={r.label}
                  passed={r.test(normalised.accountNumber)} touched={touched.accountNumber} />
              ))}
              {FIELD_RULES.ifsc.map((r, i) => (
                <RuleRow key={`ifsc-${i}`} label={r.label}
                  passed={r.test(normalised.ifsc)} touched={touched.ifsc} />
              ))}
              {FIELD_RULES.accountHolderName.map((r, i) => (
                <RuleRow key={`name-${i}`} label={r.label}
                  passed={r.test(fields.accountHolderName)} touched={touched.accountHolderName} />
              ))}
              <RuleRow label="Account existence (verified via API)" passed={false} touched={false} />
              <RuleRow label="Name match with bank records"         passed={false} touched={false} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100">
            Your account will be verified via penny drop. Ensure it's active and belongs to the registered business.
          </p>
        </div>
      </div>

      {/* ── Tips ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-amber-50/80 border border-amber-100
        rounded-xl px-4 py-3 mb-7 step-in" style={{ animationDelay: '0.1s' }}>
        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Tips
        </p>
        <div className="w-px h-3 bg-amber-200 flex-shrink-0 hidden sm:block" />
        {[
          'Use a business current account',
          'IFSC is printed on your cheque book',
          'Name must match bank records exactly',
        ].map((tip, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"/>
            {tip}
          </span>
        ))}
      </div>

      {/* ── CTA row ── */}
      <div className="flex items-center gap-3 step-in" style={{ animationDelay: '0.15s' }}>

        {/* Preview pill */}
        <div className="flex-1 min-w-0">
          {anyTouched && (normalised.accountNumber || normalised.ifsc || fields.accountHolderName) ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100
              rounded-xl px-4 py-2.5 overflow-hidden">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">
                Bank
              </span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0"/>
              {normalised.accountNumber && (
                <span className="text-sm font-mono font-bold text-gray-800 tracking-widest flex-shrink-0">
                  {maskedAccount}
                </span>
              )}
              {normalised.ifsc && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0"/>
                  <span className="text-[11px] font-mono font-bold text-gray-500 flex-shrink-0">
                    {normalised.ifsc}
                  </span>
                </>
              )}
              {isFormValid && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0"/>
                  <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">✓ Valid</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">Your bank details preview appears here</p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleVerify}
          disabled={!isFormValid || fetching || fetchDone}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${isFormValid && !fetching && !fetchDone
              ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white shadow-sm shadow-emerald-100'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Verified
            </>
          ) : (
            <>
              Verify Bank
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}