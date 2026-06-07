import { useState } from 'react';
import { validateGST, GST_RULES } from '../validation';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
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

export default function Step8GSTEnter({ pan = '', onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [gstin, setGstin]         = useState('');
  const [touched, setTouched]     = useState(false);
  const [fetching, setFetching]   = useState(false);
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
    await new Promise(r => setTimeout(r, 1500));
    setFetching(false);
    setFetchDone(true);
    if (onFetchSuccess) onFetchSuccess({ gstin: upper });
    goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.GST_READONLY);
  };

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
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
            Enter your GST Number
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Please enter your 15-digit GSTIN to continue
          </p>
        </div>
      </div>

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 step-in" style={{ animationDelay: '0.05s' }}>

        {/* LEFT — Input */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              GSTIN
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                value={upper}
                onChange={handleChange}
                onBlur={() => gstin && setTouched(true)}
                maxLength={15}
                className={`w-full px-4 py-3 pr-10 bg-white border rounded-xl text-sm font-mono font-semibold
                  text-gray-800 tracking-widest placeholder:text-gray-300 placeholder:font-sans
                  placeholder:tracking-normal outline-none transition-all duration-200
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
            <p className="text-[11px] text-gray-300 mt-1.5">Format: 2 digits · 10 PAN · 1 digit · 1 letter · 1 digit</p>
          </div>

          {/* Status banner */}
          {touched && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
              ${isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50/60 border-red-100'}`}>
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
                <p className={`text-xs font-semibold ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isValid ? 'Valid GSTIN' : 'Invalid GSTIN'}
                </p>
                <p className={`text-[11px] mt-0.5 ${isValid ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isValid
                    ? 'All validations passed. Ready to fetch details.'
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
              {rules.map((r, i) => (
                <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100">
            Your GSTIN is linked to your PAN and state code. Ensure it matches your GST certificate.
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
          'GSTIN is case-insensitive',
          'First 2 digits are your state code',
          'Characters 3–12 must match your PAN',
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
          {upper.trim() ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100
              rounded-xl px-4 py-2.5 overflow-hidden">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">
                GST
              </span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0"/>
              <span className="text-sm font-mono font-bold text-gray-800 tracking-widest">{upper}</span>
              {isValid && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0"/>
                  <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">✓ Valid</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">Your GSTIN preview appears here</p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleFetch}
          disabled={!isValid || fetching || fetchDone}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${isValid && !fetching && !fetchDone
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
              Fetching…
            </>
          ) : fetchDone ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Fetched
            </>
          ) : (
            <>
              Fetch Details
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