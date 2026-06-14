import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";

// ── Shared: PrimaryButton ────────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = '', variant = 'emerald' }) {
  const base = 'w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2';
  const styles = {
    emerald: disabled || loading
      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98] shadow-sm shadow-emerald-200',
    outline: 'border-2 border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]',
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

// ── Verification checks config ───────────────────────────────────────────────
const CHECKS = [
  { key: 'pan',        label: 'PAN Verified' },
  { key: 'gst',        label: 'GST Verified' },
  { key: 'business',   label: 'Business Validated' },
  { key: 'compliance', label: 'Compliance Check' },
];

// ── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({ label, status }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
        ${status === 'done'     ? 'bg-emerald-500'
        : status === 'failed'   ? 'bg-red-400'
        : status === 'checking' ? 'bg-emerald-100'
        : 'bg-gray-100'}`}>
        {status === 'done' && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'failed' && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {status === 'checking' && (
          <svg className="w-3 h-3 text-emerald-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {status === 'pending' && (
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        )}
      </div>
      <span className={`text-sm font-medium transition-colors duration-300
        ${status === 'done'     ? 'text-emerald-700'
        : status === 'failed'   ? 'text-red-500'
        : status === 'checking' ? 'text-gray-700'
        : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ── Spinning gear icon ───────────────────────────────────────────────────────
function GearIcon({ spinning }) {
  return (
    <svg className={`w-10 h-10 text-emerald-500 ${spinning ? 'animate-spin' : ''}`}
      style={spinning ? { animationDuration: '2s' } : {}}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Step10SystemVerify({ simulateFail = false, onSuccess }) {
  const { goToStep } = useOnboardingStore();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading');
  const [checkStatus, setCheckStatus] = useState({
    pan: 'pending', gst: 'pending', business: 'pending', compliance: 'pending',
  });
  const [retrying, setRetrying] = useState(false);

  const runVerification = async () => {
    setPhase('loading');
    setCheckStatus({ pan: 'pending', gst: 'pending', business: 'pending', compliance: 'pending' });

    const keys = CHECKS.map(c => c.key);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      setCheckStatus(prev => ({ ...prev, [key]: 'checking' }));
      await new Promise(r => setTimeout(r, 900 + i * 200));

      if (simulateFail && key === 'compliance') {
        setCheckStatus(prev => ({ ...prev, [key]: 'failed' }));
        setPhase('failed');
        return;
      }

      setCheckStatus(prev => ({ ...prev, [key]: 'done' }));
    }

    await new Promise(r => setTimeout(r, 400));
    setPhase('success');
  };

  useEffect(() => {
    runVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await new Promise(r => setTimeout(r, 300));
    setRetrying(false);
    runVerification();
  };

  const handleContinue = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      goToStep(STEPS.PARTNER_CONTRACT);  // ← changed
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-white">
      <div className="relative z-10 w-full max-w-sm mx-4"
        style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}>
        <style>{`
          @keyframes stepIn { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes popIn  { from{opacity:0;transform:scale(0.7)}              to{opacity:1;transform:scale(1)} }
        `}</style>

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <GearIcon spinning />
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">System Verification</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Verifying your business details with Trydood systems…
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 mb-6">
              {CHECKS.map(c => (
                <CheckRow key={c.key} label={c.label} status={checkStatus[c.key]} />
              ))}
            </div>
            <div className="h-10" />
          </>
        )}

        {/* ── SUCCESS ── */}
        {phase === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"
              style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both' }}>
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Success</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                All verifications successful.<br />Proceeding to Partner Contract…
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-6">
              {CHECKS.map(c => (
                <CheckRow key={c.key} label={c.label} status="done" />
              ))}
            </div>
            <PrimaryButton onClick={handleContinue}>
              Continue to Partner Contract →
            </PrimaryButton>
          </>
        )}

        {/* ── FAILED ── */}
        {phase === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5"
              style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both' }}>
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Failed</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Verification failed. Please check your details or try again.
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-6">
              {CHECKS.map(c => (
                <CheckRow
                  key={c.key}
                  label={c.label}
                  status={checkStatus[c.key] === 'checking' ? 'failed' : checkStatus[c.key]}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <PrimaryButton variant="outline" onClick={() => goToStep(STEPS.BUSINESS_VERIFICATION)} className="flex-1">
                Edit Details
              </PrimaryButton>
              <PrimaryButton onClick={handleRetry} loading={retrying} className="flex-1">
                Try Again
              </PrimaryButton>
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-300 mt-4">Step 10 of 13</p>
      </div>
    </div>
  );
}