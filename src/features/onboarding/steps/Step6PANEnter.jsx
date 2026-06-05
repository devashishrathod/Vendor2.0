import { useState } from 'react';
import { validatePAN, PAN_RULES } from '../validation';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled || loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]'
        } ${className}`}
    >
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

// ── Validation Rule Row ───────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function Step6PANEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();
  const [pan, setPan]           = useState('');
  const [touched, setTouched]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  const upper   = pan.toUpperCase();
  const error   = validatePAN(upper);
  const isValid = !error && upper.length === 10;
  const rules   = PAN_RULES.map(r => ({ label: r.label, passed: r.test(upper) }));

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(val);
    if (!touched && val.length > 0) setTouched(true);
    setFetchDone(false);
  };

  const handleFetch = async () => {
    if (!isValid) return;
    setFetching(true);
    await new Promise(r => setTimeout(r, 1500));
    setFetching(false);
    setFetchDone(true);
    if (onFetchSuccess) onFetchSuccess({ pan: upper });
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_READONLY);
  };

  const bannerType = !touched ? null : isValid ? 'valid' : 'invalid';

  return (
    <div className="flex items-center justify-center p-0">
      <div className="w-full max-w-2xl p-8">

        {/* Icon + Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Enter your PAN number</h2>
          <p className="text-sm text-gray-400">Please enter your 10-digit PAN to continue</p>
        </div>

        {/* Horizontal layout: left = input + status banner, right = validation checklist */}
        <div className="grid grid-cols-2 gap-5 mb-6">

          {/* LEFT — Input + status */}
          <div className="flex flex-col gap-4">
            {/* Input */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                PAN Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={upper}
                  onChange={handleChange}
                  onBlur={() => pan && setTouched(true)}
                  maxLength={10}
                  className={`w-full px-4 py-3 pr-10 bg-white border-2 rounded-xl text-sm font-mono font-semibold text-gray-800 tracking-widest
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
              <p className="text-xs text-gray-400 mt-1.5">Format: 5 letters · 4 digits · 1 letter</p>
            </div>

            {/* Status banner */}
            {touched && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
                ${isValid
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
                }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${isValid ? 'bg-emerald-500' : 'bg-red-400'}`}>
                  {isValid ? (
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
                  <p className={`text-xs font-medium ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                    {isValid ? 'Valid PAN' : 'Invalid PAN'}
                  </p>
                  <p className={`text-xs mt-0.5 ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isValid
                      ? 'All validations passed. Ready to fetch details.'
                      : 'Fix the errors on the right to continue.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Validation checklist */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Validation rules
            </p>
            <div className="space-y-2.5">
              {rules.map((r, i) => (
                <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <PrimaryButton onClick={handleFetch} disabled={!isValid} loading={fetching}>
          {fetching ? 'Fetching details…' : fetchDone ? '✓ Details fetched' : 'Fetch details'}
        </PrimaryButton>

        <p className="text-center text-xs text-gray-300 mt-4">Step 6 of 13</p>
      </div>
    </div>
  );
}