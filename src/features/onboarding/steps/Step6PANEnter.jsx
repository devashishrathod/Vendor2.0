import { useState, useEffect } from 'react';
import { validatePAN, PAN_RULES } from '../validation';
import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { verifyPAN } from '@/features/onboarding/services/api/verify.api';
import ErrorToast from '@/components/common/ErrorToast';
import ErrorModal from '@/components/common/ErrorModal';
import { parseApiError } from '@/hooks/useApiError';

// ── Success Toast (200) ─────────────────────────────────────────────
function SuccessToast({ show, pan, onDismiss }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  if (!show) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 px-4 py-3 rounded-xl
        max-w-sm w-[calc(100vw-3rem)]"
      style={{
        background: '#f0fdf4',
        border: '0.5px solid #86efac',
        borderLeft: '3px solid #22c55e',
        animation: 'slideInToast 0.22s cubic-bezier(0.34,1.4,0.64,1) both',
      }}
    >
      <style>{`
        @keyframes slideInToast {
          from { opacity:0; transform:translateY(14px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-emerald-800">PAN verified successfully</p>
        <p className="text-[11px] text-emerald-600 mt-0.5 font-mono tracking-widest">{pan}</p>
        <p className="text-[10px] text-emerald-500 mt-1">Redirecting to review screen…</p>
      </div>

      <button onClick={onDismiss} aria-label="Dismiss"
        className="text-emerald-400 hover:text-emerald-600 transition-colors flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── RuleRow ─────────────────────────────────────────────────────────
function RuleRow({ label, passed, touched }) {
  const color = !touched ? 'text-gray-400' : passed ? 'text-emerald-600' : 'text-red-500';
  const bg = !touched ? 'bg-gray-100' : passed ? 'bg-emerald-100' : 'bg-red-100';
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

// ── Main Component ───────────────────────────────────────────────────
export default function Step6PANEnter({ onFetchSuccess }) {
  const { goToStep } = useOnboardingStore();

  const [pan, setPan] = useState('');
  const [touched, setTouched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const upper = pan.toUpperCase();
  const error = validatePAN(upper);
  const isValid = !error && upper.length === 10;
  const rules = PAN_RULES.map(r => ({ label: r.label, passed: r.test(upper) }));

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(val);
    if (!touched && val.length > 0) setTouched(true);
    setFetchDone(false);
    setApiError(null);
    setShowModal(false);
  };

  const handleFetch = async () => {
    if (!isValid) return;
    setFetching(true);
    setApiError(null);
    setShowModal(false);
    setSuccessMsg(false);

    try {
      const data = await verifyPAN(upper);

      // ✅ 200 success
      const pan_data = data?.data || data;

      console.log('Step6 — raw API response:', data);
      console.log('Step6 — normalised pan_data:', pan_data);

      useOnboardingStore.getState().setPanDetails(pan_data);
      if (onFetchSuccess) onFetchSuccess(pan_data);

      setFetchDone(true);
      setSuccessMsg(true); // show success toast

      setTimeout(() => {
        goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.PAN_READONLY);
      }, 1500);

    } catch (err) {
      // ✅ 400 — parse nested error
      let parsed;
      try {
        const errData = typeof err.message === 'string'
          ? JSON.parse(err.message)
          : err;
        parsed = parseApiError(errData);
      } catch {
        parsed = { humanMessage: err.message || 'PAN verification failed.', txnId: null };
      }
      setApiError(parsed);
      setShowModal(true);
    } finally {
      setFetching(false);
    }
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
              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
            Enter Your Business PAN Number
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Please enter your 10-digit PAN to continue
          </p>
        </div>
      </div>

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 step-in" style={{ animationDelay: '0.05s' }}>

        {/* LEFT — Input */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              Business PAN
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={upper}
                onChange={handleChange}
                onBlur={() => { if (pan) setTouched(true); }}
                maxLength={10}
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
            <p className="text-[11px] text-gray-300 mt-1.5">Format: 5 letters · 4 digits · 1 letter</p>
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
                  {isValid ? 'Valid PAN' : 'Invalid PAN'}
                </p>
                <p className={`text-[11px] mt-0.5 ${isValid ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isValid
                    ? 'All validations passed. Ready to fetch details.'
                    : error ?? 'Fix the errors on the right to continue.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Validation checklist */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-4 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Validation Rules
          </p>
          <div className="space-y-2.5">
            {rules.map((r, i) => (
              <RuleRow key={i} label={r.label} passed={r.passed} touched={touched} />
            ))}
          </div>
        </div>
      </div>



      {/* Tips — compact card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 step-in"
        style={{ animationDelay: '0.1s' }}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest
    flex items-center gap-1.5 mb-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tips
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            'PAN is case-insensitive',
            'No spaces or special characters',
            'Must match your business registration',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
              <span className="text-[11px] text-slate-500 leading-snug">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA row ── */}
      <div className="flex items-center gap-3 step-in" style={{ animationDelay: '0.15s' }}>

        {/* Preview pill */}
        <div className="flex-1 min-w-0">
          {upper.trim() ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100
              rounded-xl px-4 py-2.5 overflow-hidden">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">PAN</span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
              <span className="text-sm font-mono font-bold text-gray-800 tracking-widest">{upper}</span>
              {isValid && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">✓ Valid</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">Your PAN preview appears here</p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleFetch}
          disabled={!isValid || fetching}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${isValid && !fetching
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </>
          ) : (
            <>
              Fetch Details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ── Success Toast — 200 ── */}
      <SuccessToast
        show={successMsg}
        pan={upper}
        onDismiss={() => setSuccessMsg(false)}
      />

      {/* ── Error Modal — 400 ── */}
      <ErrorModal
        error={showModal ? apiError : null}
        onDismiss={() => { setShowModal(false); setApiError(null); }}
        onRetry={() => { setShowModal(false); setApiError(null); handleFetch(); }}
      />

      {/* ── Error Toast — fallback ── */}
      <ErrorToast
        error={!showModal && apiError ? apiError : null}
        onDismiss={() => setApiError(null)}
      />
    </div>
  );
}