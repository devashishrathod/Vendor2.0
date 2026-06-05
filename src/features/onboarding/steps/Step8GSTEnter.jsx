import { useState } from 'react';

import { validateGST, GST_RULES } from '../validation';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
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
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${className}`}
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
        <p className="text-xs font-bold text-emerald-700">Valid GST</p>
        <p className="text-xs text-emerald-600 mt-0.5">All validations passed · Fetch Details enabled</p>
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
        <p className="text-xs font-bold text-red-600">Invalid GSTIN</p>
        <p className="text-xs text-red-500 mt-0.5">Fix the flagged issues in the checklist</p>
      </div>
    </div>
  );

  return null;
}



// ── Main component ───────────────────────────────────────────────────────────
export default function Step8GSTEnter({ pan = '', onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [gstin, setGstin]       = useState('');
  const [touched, setTouched]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  const upper   = gstin.toUpperCase();
  const error   = validateGST(upper);
  const isValid = !error && upper.length === 15;

  const rules = GST_RULES.map(r => ({
    label: r.label,
    passed: r.test(upper, pan),
  }));

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(val);
    if (!touched && val.length > 0) setTouched(true);
    setFetchDone(false);
  };

  const handleFetch = async () => {
    if (!isValid) return;
    setFetching(true);
    // TODO: replace with real API call
    // const res = await fetch('/api/gst/verify', { method: 'POST', body: JSON.stringify({ gstin: upper }) });
    // const data = await res.json();
    await new Promise(r => setTimeout(r, 1500)); // simulate
    setFetching(false);
    setFetchDone(true);
    // useOnboardingStore.getState().setGSTData(data);
    if (onFetchSuccess) onFetchSuccess({ gstin: upper });
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.GST_READONLY); // ✅
  };

  const bannerType = !touched ? null : isValid ? 'valid' : 'invalid';

  return (
    <div className=" flex flex-col items-center justify-center ">

     

      {/* Horizontal card */}
      <div
        className="w-full max-w-3xl  overflow-hidden"
        style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── LEFT: Input panel ── */}
          <div className="p-7 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-gray-100">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Enter Your GST Number</h2>
                <p className="text-xs text-gray-400 mt-0.5">Please enter your 15-digit GSTIN</p>
              </div>
            </div>

            {/* GST Input */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                GSTIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={upper}
                  onChange={handleChange}
                  onBlur={() => gstin && setTouched(true)}
                  maxLength={15}
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
              <p className="text-right text-xs text-gray-300 mt-1">{upper.length} / 15</p>
            </div>

            {/* Status banner */}
            {touched && (
              <StatusBanner type={bannerType} />
            )}

            {/* Fetch CTA — pushed to bottom */}
            <div className="mt-auto pt-2">
              <PrimaryButton onClick={handleFetch} disabled={!isValid || fetchDone} loading={fetching}>
                {fetching ? 'Fetching Details…' : fetchDone ? '✓ Details Fetched' : 'Fetch Details'}
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
                {rules.map((r, i) => (
                  <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                Your GSTIN is linked to your PAN and state code. Make sure the details match your GST registration certificate.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}