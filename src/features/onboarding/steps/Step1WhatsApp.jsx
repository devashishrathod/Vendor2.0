import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, MessageCircle, ShieldCheck, Store } from "lucide-react";
import LoginArt from "@/assets/images/Login1.png";
import Logo from "@/assets/Logo1.png";
import AppBackground from "@/components/common/AppBackground";
import { ROLES } from "@/constants";
import { HELPDESK_EMAIL, TERMS_URL } from "@/features/onboarding-v2/constants/onboardingOptions";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { clearSessionEndNotice, readSessionEndNotice } from "@/features/onboarding/utils/sessionEnd";
import Step2OTP from "./Step2VerifyOTP";
import { validateWhatsApp } from "../validation";

const PHONE_LENGTH = 10;

/**
 * The logo has dark lettering, so it sits on a white tile — readable in
 * light and dark mode alike. Logo1.png (591×422) has transparent margins
 * around the mark (x 56–534, y 68–354); the box keeps only the mark.
 */
function LogoTile() {
  return (
    <span className="inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5">
      <span className="relative block aspect-[478/286] h-9 overflow-hidden">
        <img src={Logo} alt="Trydood" className="absolute left-[-11.7%] top-[-23.8%] w-[123.6%] max-w-none" />
      </span>
    </span>
  );
}

export default function Step1WhatsApp() {
  const { sendOTP, loading } = useAuthStore();
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  // After a forced logout (session expired, account deactivated) the server's
  // message is shown here once.
  const [error, setError] = useState(readSessionEndNotice);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  useEffect(() => clearSessionEndNotice(), []);

  const isComplete = phoneOrEmail.length === PHONE_LENGTH;
  const isDisabled = loading || !isComplete;

  const handleSendOTP = async () => {
    const err = validateWhatsApp(phoneOrEmail);
    if (err) return setError(err);
    setError(null);
    try {
      await sendOTP(phoneOrEmail, ROLES.VENDOR);
      setOtpModalOpen(true);
    } catch (e) {
      setError(e.message || "Failed to send OTP. Please try again.");
      // 429: a code was already sent to this number moments ago (one per
      // 60s, API doc #1 note 2) — let the vendor enter that one.
      if (e?.status === 429) setOtpModalOpen(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDisabled) handleSendOTP();
  };

  return (
    <div className="app-shell-bg relative isolate min-h-screen w-full lg:grid lg:h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden">
      <AppBackground />

      {/* ── Artwork (large screens only — on a phone the form comes first).
          The art already carries the brand, so nothing is laid over it. It
          fills the whole column height (grid stretch + flex-1); the image is
          absolutely placed so its own size never changes the panel's. ── */}
      <aside className="hidden lg:flex lg:min-h-0 lg:flex-col lg:p-4">
        <div className="group relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-amber-950 shadow-2xl shadow-gray-900/15 ring-1 ring-black/5 dark:shadow-none dark:ring-white/10">
          <img
            src={LoginArt}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
      </aside>

      {/* ── Form ── */}
      <main className="flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:py-6">
        <header className="flex items-center justify-between gap-3">
          <LogoTile />
          <a
            href={`mailto:${HELPDESK_EMAIL}`}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-white/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Need help?
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <div className="rounded-3xl border border-gray-200/80 bg-white/85 p-6 shadow-xl shadow-gray-900/5 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-gray-900/70 dark:shadow-none">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25">
                <Store size={12} aria-hidden="true" />
                Vendor Panel
              </span>

              <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Log in with your WhatsApp number. We&apos;ll send you a 6-digit code to verify it&apos;s you.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-7">
                <label htmlFor="whatsapp-number" className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">
                  WhatsApp number
                </label>
                <div
                  className={`mt-2 flex h-12 items-center overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 dark:bg-gray-950/40 ${
                    error
                      ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/10 dark:border-red-500/50"
                      : "border-gray-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/15 dark:border-white/10"
                  }`}
                >
                  <span className="flex h-full select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                    <MessageCircle size={16} className="text-emerald-500" aria-hidden="true" />
                    +91
                  </span>
                  <input
                    id="whatsapp-number"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    autoFocus
                    placeholder="98765 43210"
                    value={phoneOrEmail}
                    onChange={(e) => {
                      setPhoneOrEmail(e.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH));
                      setError(null);
                    }}
                    maxLength={PHONE_LENGTH}
                    aria-invalid={error ? true : undefined}
                    aria-describedby="whatsapp-number-hint"
                    className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] font-medium tracking-[0.06em] text-gray-900 tabular-nums placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                  />
                  {isComplete && !error && (
                    <CheckCircle2 size={18} className="mr-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  )}
                </div>

                <div id="whatsapp-number-hint" className="mt-2 min-h-5">
                  {error ? (
                    <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">The code arrives on WhatsApp in a few seconds.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition duration-200 active:scale-[0.99] ${
                    isDisabled && !loading
                      ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                      : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Get verification code
                      <ArrowRight size={16} className="transition-transform group-enabled:group-hover:translate-x-0.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <ShieldCheck size={14} className="shrink-0 text-emerald-500" aria-hidden="true" />
                We will never share your number with anyone.
              </p>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              By continuing, you agree to Trydood&apos;s{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-700 underline-offset-2 hover:underline dark:text-gray-200"
              >
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} Trydood</span>
          <a
            href={`mailto:${HELPDESK_EMAIL}`}
            className="inline-flex items-center gap-1.5 font-medium text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400"
          >
            <Mail size={13} aria-hidden="true" />
            {HELPDESK_EMAIL}
          </a>
        </footer>
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
