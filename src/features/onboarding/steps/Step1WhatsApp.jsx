import { useState } from "react";
import Image1 from "@/assets/svg/device-sync.svg";
import Image2 from "../../../assets/Logo1.jpg";
import Step2OTP from "./Step2VerifyOTP";
import { validateWhatsApp } from "../validation";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { ROLES } from "@/constants";

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 mt-2 text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <svg
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

export default function Step1WhatsApp() {
  const { sendOTP, loading } = useAuthStore();
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [error, setError] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const handleSendOTP = async () => {
    const err = validateWhatsApp(phoneOrEmail);
    if (err) return setError(err);
    setError(null);
    try {
      await sendOTP(phoneOrEmail, ROLES.VENDOR);
      setOtpModalOpen(true);
    } catch (e) {
      setError(e.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSendOTP();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-white">
      {/* ── Glow ── */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.15) 0%, transparent 70%)",
        }}
      />

      <style>{`
        @keyframes floatB {
          0%,100% { transform: translateY(0px) scale(1); }
          50%     { transform: translateY(-14px) scale(1.03); }
        }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 pt-10 pb-4 md:pt-0 md:pb-0 md:pl-10 md:pr-6 relative z-10 gap-4 md:gap-6">
        <img
          src={Image1}
          alt="Business Growth Illustration"
          className="w-48 sm:w-64 md:w-full md:max-w-md h-auto object-contain drop-shadow-sm"
        />
        <div className="text-center max-w-xs px-4">
          <p className="text-gray-700 text-sm md:text-md font-medium leading-relaxed">
            Grow your business with ease on <br />
            <span className="text-emerald-500 font-bold">Trydood.</span>
          </p>
          <p className="text-gray-500 text-xs leading-relaxed mt-1">
            Enjoy low-cost subscriptions and easy access
            <br />
            to powerful business tools.
          </p>
        </div>
      </div>

      {/* ── Divider (mobile only) ── */}
      <div className="block md:hidden w-full px-8">
        <div className="border-t border-gray-100" />
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center relative z-10 px-4 py-8 md:py-0">
        <div className="w-full max-w-sm px-6 sm:px-8 py-8 md:py-10 flex flex-col">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src={Image2}
              alt="Trydood"
              className="w-28 h-20 md:w-36 md:h-24 object-contain"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Welcome <span className="text-emerald-500">Back!</span>
            </h2>
            <p className="text-sm text-gray-400">
              Enter your WhatsApp number to continue
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter WhatsApp number"
                value={phoneOrEmail}
                onChange={(e) => {
                  setPhoneOrEmail(
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  );
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                maxLength={10}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition duration-200"
              />
            </div>

            <ErrorMessage message={error} />

            <div className="flex justify-center">
              <button
                onClick={handleSendOTP}
                disabled={loading || phoneOrEmail.length < 10}
                className={`w-3/4 py-2.5 font-bold rounded-xl text-sm tracking-widest transition duration-200 active:scale-95 flex items-center justify-center gap-2
                  ${
                    loading || phoneOrEmail.length < 10
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    SEND OTP <span>→</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 mt-1">
              <svg
                className="w-3.5 h-3.5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              We will never share your number with anyone.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">
                In case of any queries, reach out to
              </p>
              <a
                href="mailto:TrydoodTeam@gmail.com"
                className="text-sm text-emerald-500 hover:text-emerald-600 font-medium hover:underline transition"
              >
                trydoodteam@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── OTP Modal ── */}
      <Step2OTP
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        phoneNumber={phoneOrEmail}
        onVerified={() => setOtpModalOpen(false)}
      />
    </div>
  );
}