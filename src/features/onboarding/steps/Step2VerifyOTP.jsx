import { useCallback, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateOTP } from "../validation";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { ROLES } from "@/constants";
import { registerCurrentDevice } from "@/features/onboarding/services/api/deviceToken.api";
import { routeForScreen } from "@/features/onboarding-v2/config/routes";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

// One code per number every 60 seconds (API doc #1 note 2).
const RESEND_WAIT_SECONDS = 60;

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

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
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export default function Step2VerifyOTP({ isOpen, onClose, phoneNumber, onVerified }) {
  const { verifyOTP, sendOTP, loading } = useAuthStore();
  // brandId is still read from the old onboarding store by the under-review
  // page and services/api getBrandId(); routing does not use this store.
  const setBrandId = useOnboardingStore((s) => s.setBrandId);
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(RESEND_WAIT_SECONDS);
  const [canResend, setCanResend] = useState(false);
  // Loading the onboarding status right after the code is accepted.
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);
  // The one running countdown. Kept in a ref so a resend replaces it instead
  // of starting a second interval (two ran the countdown at double speed).
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    setResendTimer(RESEND_WAIT_SECONDS);
    setCanResend(false);
    startCountdown();
    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isOpen, startCountdown]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setOtp(["", "", "", "", "", ""]);
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
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft"  && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    // Fill what was pasted (a partial code too) instead of dropping it.
    setOtp(Array.from({ length: 6 }, (_, i) => pasted[i] ?? ""));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    setError(null);
  };

  const otpString = otp.join("");

  const handleVerify = async () => {
    const err = validateOTP(otpString);
    if (err) return setError(err);
    let res;
    try {
      res = await verifyOTP(phoneNumber, otpString, ROLES.VENDOR);
    } catch (e) {
      // OTP errors (wrong / expired code, too many tries) carry no code — show the server's text.
      setError(e.message || "Invalid OTP. Please try again.");
      return;
    }

    const brandId = res?.data?.user?.brandId;
    if (brandId) setBrandId(brandId);

    // Register this device for push notifications now that the vendor
    // has a valid session — failures here shouldn't block onboarding,
    // just log and move on.
    registerCurrentDevice().catch((err) => {
      console.error('[OTP] registerCurrentDevice failed:', err);
    });

    // Route from GET /brands/onboarding/status, never from the login
    // response or isFirst (guide §2.3, §4.0). A pending deed confirmation is
    // shown as a blocking popup over whatever page this opens.
    try {
      setVerifying(true);
      const status = await fetchStatus();
      onVerified?.();
      navigate(routeForScreen(status?.currentScreen), { replace: true });
    } catch (e) {
      console.error('[OTP] onboarding status fetch failed:', e);
      setError(e.message || "Logged in, but we couldn't load your progress. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    setCanResend(false);
    try {
      await sendOTP(phoneNumber, ROLES.VENDOR);
      setResendTimer(RESEND_WAIT_SECONDS);
      startCountdown();
    } catch (e) {
      setError(e.message || "Failed to resend OTP.");
      // 429 says how long until the next code is allowed; any other failure
      // can be retried straight away.
      const wait = Number(e?.details?.retryAfterSeconds);
      if (e?.status === 429 && wait > 0) {
        setResendTimer(Math.ceil(wait));
        startCountdown();
      } else {
        setCanResend(true);
      }
    }
    inputRefs.current[0]?.focus();
  };

  if (!isOpen) return null;

  const maskedNumber = phoneNumber
    ? `+91 ${phoneNumber.slice(0, 2)}••••••${phoneNumber.slice(-2)}`
    : "+91 ••••••••••";

  return (
    <>
      {/* No onClick here on purpose — a stray click outside the box shouldn't
          throw away the OTP being typed. Only the ✕ button closes it. */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.2s ease both" }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ pointerEvents: "none" }}>
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm relative"
          style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both", pointerEvents: "auto" }}
        >
          <style>{`
            @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Verification Code </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              We have sent a 6-digit OTP on<br />
              <span className="text-gray-600 dark:text-gray-300 font-semibold">{maskedNumber}</span>
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-12 text-center text-lg font-bold rounded-xl outline-none transition-all duration-150
                  ${digit ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-gray-800 dark:text-gray-100"}
                  focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-100 dark:focus:bg-emerald-500/10 dark:focus:ring-emerald-500/30`}
              />
            ))}
          </div>

          <ErrorMessage message={error} />

          <div className="text-center mt-3 mb-5">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-xs text-emerald-500 font-semibold hover:text-emerald-600 hover:underline transition disabled:opacity-50"
              >
                {loading ? "Sending…" : "Resend OTP"}
              </button>
            ) : (
              <p className="text-xs text-gray-400">
                Resend Code in{" "}
                <span className="text-emerald-500 font-bold tabular-nums">
                  {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:{String(resendTimer % 60).padStart(2, "0")}
                </span>
              </p>
            )}
          </div>

          <PrimaryButton onClick={handleVerify} disabled={otpString.length < 6} loading={loading || verifying}>
            {loading || verifying ? "Verifying…" : "Continue →"}
          </PrimaryButton>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            🔒 We will never share your number with anyone.
          </p>
        </div>
      </div>
    </>
  );
}