import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateOTP } from '../validation';
// import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
// import { STEPS } from "@/features/onboarding/constants/steps";

// ── ErrorMessage component ────────────────────────────────────────────────────
function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

// ── PrimaryButton component ───────────────────────────────────────────────────
function PrimaryButton({ children, onClick, disabled, loading, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${disabled || loading
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98] shadow-sm shadow-emerald-200"
        } ${className}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// ── OTP Modal ─────────────────────────────────────────────────────────────────
export default function Step2VerifyOTP({ isOpen, onClose, phoneNumber, onVerified }) {
  // const { goToStep } = useOnboardingStore();
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend]     = useState(false);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();

  // ── Countdown timer ──
  useEffect(() => {
    if (!isOpen) return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // ── Auto-focus first input when modal opens ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setOtp(['', '', '', '', '', '']);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const otpString = otp.join('');

  const handleVerify = async () => {
    const err = validateOTP(otpString);
    if (err) return setError(err);
    setLoading(true);
    try {
      // await api.verifyOTP(phoneNumber, otpString);
      console.log('[API] verifyOTP →', otpString);
      await new Promise(r => setTimeout(r, 800)); // simulated delay
      onVerified?.();
      navigate('/onboarding'); // adjust route as needed
      // goToStep(STEPS.KNOW_YOUR_BRAND);
    } catch (e) {
      setError(e.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setCanResend(false);
    setResendTimer(30);
    console.log('[API] resendOTP →', phoneNumber);
    // restart countdown
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    inputRefs.current[0]?.focus();
  };

  if (!isOpen) return null;

  const maskedNumber = phoneNumber
    ? `+91 ${phoneNumber.slice(0, 2)}••••••${phoneNumber.slice(-2)}`
    : '+91 ••••••••••';

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease both' }}
      />

      {/* ── Modal ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 w-full max-w-sm relative"
          style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both', pointerEvents: 'auto' }}
        >
          <style>{`
            @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            {/* OTP icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              We have sent a 6-digit OTP on<br />
              <span className="text-gray-600 font-semibold">{maskedNumber}</span>
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all duration-150
                  ${digit ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
                  focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100`}
              />
            ))}
          </div>

          <ErrorMessage message={error} />

          {/* Resend */}
          <div className="text-center mt-3 mb-5">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-xs text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-xs text-gray-400">
                Resend OTP in{' '}
                <span className="text-emerald-500 font-bold tabular-nums">
                  00:{String(resendTimer).padStart(2, '0')}
                </span>
              </p>
            )}
          </div>

          {/* Verify button */}
          <PrimaryButton
            onClick={handleVerify}
            disabled={otpString.length < 6}
            loading={loading}
          >
            {loading ? 'Verifying…' : 'Continue →'}
          </PrimaryButton>

          {/* Trust line */}
          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 We will never share your number with anyone.
          </p>
        </div>
      </div>
    </>
  );
}