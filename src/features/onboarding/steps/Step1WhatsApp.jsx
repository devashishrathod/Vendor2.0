import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Image1 from "@/assets/images/Login1.png";
import Image2 from "../../../assets/Logo1.png";
import Step2OTP from "./Step2VerifyOTP";
import { validateWhatsApp } from "../validation";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { ROLES } from "@/constants";

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl px-3 py-2">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

export default function Step1WhatsApp() {
  const { sendOTP, loading } = useAuthStore();
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [error, setError] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const isDisabled = loading || phoneOrEmail.length < 10;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDisabled) handleSendOTP();
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {/* ── Left Panel (image) ── */}
      <aside className="p-3 sm:p-4 lg:h-screen lg:p-5">
        <div className="h-56 w-full overflow-hidden rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 sm:h-72 lg:h-full">
          <img
            src={Image1}
            alt="Vendor using Trydood"
            className="h-full w-full object-cover object-[80%_center]"
          />
        </div>
      </aside>

      {/* ── Right Panel (form) ── */}
      <main className="flex items-start justify-center px-4 py-6 sm:px-6 lg:h-screen lg:items-center lg:overflow-y-auto lg:px-10 lg:py-8">
        <div className="w-full max-w-md p-2 sm:p-6">
          {/* Logo */}
          <img
            src={Image2}
            alt="Trydood"
            className="mx-auto h-16 w-auto object-cover sm:h-20"
          />

          {/* Heading */}
          <div className="mt-5 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Welcome <span className="text-emerald-500">Back!</span>
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Enter your WhatsApp number to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="whatsapp-number"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
              >
                WhatsApp Number
              </label>
              <div
                className={`flex items-center overflow-hidden rounded-xl border bg-white dark:bg-gray-800 transition focus-within:ring-4
                  ${error
                    ? "border-red-300 focus-within:ring-red-500/10"
                    : "border-gray-200 dark:border-gray-700 focus-within:border-emerald-400 focus-within:ring-emerald-500/15"
                  }`}
              >
                <span className="flex items-center gap-1.5 self-stretch border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300 select-none">
                  <MessageCircle size={16} className="text-emerald-500" />
                  +91
                </span>
                <input
                  id="whatsapp-number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phoneOrEmail}
                  onChange={(e) => {
                    setPhoneOrEmail(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError(null);
                  }}
                  maxLength={10}
                  className="w-full bg-transparent px-4 py-3.5 text-sm tracking-wide text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                />
                <span className="pr-4 text-xs font-medium tabular-nums text-gray-400">
                  {phoneOrEmail.length}/10
                </span>
              </div>
            </div>

            <ErrorMessage message={error} />

            <button
              type="submit"
              disabled={isDisabled}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide transition duration-200 active:scale-[0.98]
                ${isDisabled
                  ? "cursor-not-allowed bg-emerald-500/40 text-white dark:bg-emerald-500/20 dark:text-emerald-100/60"
                  : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Get Verification Code
                  <ArrowRight
                    size={16}
                    className="transition-transform group-enabled:group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              We will never share your number with anyone.
            </p>
          </form>

          {/* Footer */}
          <div className="mt-8 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <Mail size={18} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                In case of any queries, reach out to
              </p>
              <a
                href="mailto:helpdesk@trydood.com"
                className="block truncate text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                helpdesk@trydood.com
              </a>
            </div>
          </div>
        </div>
      </main>

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
