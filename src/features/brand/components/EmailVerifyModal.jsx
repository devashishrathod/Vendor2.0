import { useState } from "react";
import { Mail, X, ShieldCheck, Loader2 } from "lucide-react";
import { sendEmailVerification, verifyEmailOtp } from "../services/brandApi";

// "Verify Email" modal, opened from the Email ID field in General Details
// when profile.user.isEmailVerified is false. Two steps:
//   1. Confirm/change the email → POST /auth/email/send-verification.
//      Leaving the field as-is just re-verifies the current email;
//      changing it switches the account to the new one once the OTP
//      below is confirmed (backend flags this via response.data.isChange).
//   2. Enter the OTP that was emailed → POST /auth/email/verify.
export default function EmailVerifyModal({ currentEmail, onClose, onVerified }) {
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState(currentEmail || "");
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [isChange, setIsChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await sendEmailVerification(email.trim());
      setSentTo(res?.data?.sentTo || email.trim());
      setIsChange(!!res?.data?.isChange);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the code sent to your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyEmailOtp({ otp: otp.trim(), email: email.trim() });
      setSuccess(true);
      await onVerified?.();
    } catch (err) {
      setError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {success ? "Email Verified" : "Verify Email"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" strokeWidth={1.8} />
              </div>
              <p className="text-sm text-gray-700">
                {email.trim()} has been verified successfully.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          ) : step === "email" ? (
            <form onSubmit={handleSendCode}>
              <p className="text-xs text-gray-400 mb-4">
                Confirm your current email to verify it, or enter a different one to switch to it instead.
              </p>
              <label className="text-xs font-semibold text-gray-900">Email Address</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  autoFocus
                />
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Sending…" : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-xs text-gray-400 mb-4">
                {isChange
                  ? `We've sent a code to ${sentTo}. Enter it to switch your account to this address.`
                  : `We've sent a code to ${sentTo}. Enter it to verify this email.`}
              </p>
              <label className="text-xs font-semibold text-gray-900">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 tracking-widest outline-none placeholder:text-gray-400 placeholder:tracking-normal focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                autoFocus
              />
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Verifying…" : "Verify Email"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="mt-2 w-full text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
