import { useState, useEffect } from "react";
import { validateGST, GST_RULES } from "../validation";
import {
  useOnboardingStore,
  BIZ_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { verifyGST } from "@/features/onboarding/services/api/verify.api";
import ErrorToast from "@/components/common/ErrorToast";
import ErrorModal from "@/components/common/ErrorModal";
import { parseApiError } from "@/hooks/useApiError";

// ── Success Toast ────────────────────────────────────────────────────
function SuccessToast({ show, gstin, onDismiss }) {
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
        background: "#f0fdf4",
        border: "0.5px solid #86efac",
        borderLeft: "3px solid #22c55e",
        animation: "slideInToast 0.22s cubic-bezier(0.34,1.4,0.64,1) both",
      }}
    >
      <style>{`
        @keyframes slideInToast {
          from { opacity:0; transform:translateY(14px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-emerald-800">
          GST verified successfully
        </p>
        <p className="text-[11px] text-emerald-600 mt-0.5 font-mono tracking-widest truncate">
          {gstin}
        </p>
        <p className="text-[10px] text-emerald-500 mt-1">
          Redirecting to review screen…
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-emerald-400 hover:text-emerald-600 transition-colors flex-shrink-0"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// ── RuleRow ──────────────────────────────────────────────────────────
function RuleRow({ label, passed, touched }) {
  const color = !touched
    ? "text-gray-400"
    : passed
      ? "text-emerald-600"
      : "text-red-500";
  const bg = !touched
    ? "bg-gray-100"
    : passed
      ? "bg-emerald-100"
      : "bg-red-100";
  return (
    <div className="flex items-center gap-2 transition-all duration-200">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}
      >
        {!touched ? (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        ) : passed ? (
          <svg
            className="w-2.5 h-2.5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors duration-200 ${color}`}
      >
        {label}
      </span>
    </div>
  );
}

// ── PAN-GST Mismatch Banner ──────────────────────────────────────────
function PANMismatchBanner({ gstin, pan }) {
  if (!gstin || gstin.length < 12 || !pan || pan.length !== 10) return null;
  const panFromGST = gstin.substring(2, 12).toUpperCase();
  const panUpper = pan.toUpperCase();
  if (panFromGST === panUpper) return null;

  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-2">
      <svg
        className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <p className="text-xs font-semibold text-red-600">
          PAN mismatch detected
        </p>
        <p className="text-[11px] text-red-400 mt-0.5 leading-snug">
          GSTIN contains{" "}
          <span className="font-mono font-bold">{panFromGST}</span> but your PAN
          is <span className="font-mono font-bold">{panUpper}</span>. Characters
          3–12 of GSTIN must match your PAN exactly.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function Step8GSTEnter({ pan: panProp = "" }) {
  const { goToStep } = useOnboardingStore();

  // Fallback: pull PAN from the onboarding store in case the parent
  // didn't pass the `pan` prop correctly (this was the root cause of
  // "PAN embedded matches" always failing even on a valid GSTIN).
  const panFromStore = useOnboardingStore(
    (state) =>
      state.formData?.panDetails?.data?.pan ||
      state.formData?.panDetails?.pan ||
      "",
  );

  const pan = panProp || panFromStore;

  const [gstin, setGstin] = useState("");
  const [touched, setTouched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const upper = gstin.toUpperCase();
  const error = validateGST(upper, pan);
  const isValid = !error && upper.length === 15;
  const rules = GST_RULES.map((r) => ({
    label: r.label,
    passed: r.test(upper, pan),
  }));

  const handleChange = (e) => {
    const val = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 15);
    setGstin(val);
    if (!touched && val.length > 0) setTouched(true);
    setFetchDone(false);
    setApiError(null);
    setShowModal(false);
  };

  const handleFetch = async () => {
    if (!isValid) return;

    if (pan && pan.trim().length === 10) {
      const panFromGST = upper.substring(2, 12);
      if (panFromGST !== pan.toUpperCase()) return;
    }

    setFetching(true);
    setApiError(null);
    setShowModal(false);
    setSuccessMsg(false);

    try {
      const data = await verifyGST(upper);
      const gst_data = data?.data || data;

      useOnboardingStore.getState().setGstDetails(gst_data);

      setFetchDone(true);
      setSuccessMsg(true);

      setTimeout(() => {
        goToStep(STEPS.BUSINESS_VERIFICATION, BIZ_SUB.GST_READONLY);
      }, 1500);
    } catch (err) {
      setApiError({
        humanMessage: err.message ?? 'GST verification failed. Please try again.',
        txnId: null,
      });
      setShowModal(true);
      setTimeout(() => { setShowModal(false); setApiError(null); }, 3500);
    } finally {
      setFetching(false);
    }
  };

  const hasPANMismatch =
    pan &&
    pan.trim().length === 10 &&
    upper.length >= 12 &&
    upper.substring(2, 12) !== pan.toUpperCase();

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
        <div
          className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100
          flex items-center justify-center flex-shrink-0"
        >
          <svg
            className="w-5 h-5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
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

        {pan && (
          <div
            className="ml-auto flex items-center gap-1.5 bg-blue-50 border border-blue-100
            rounded-full px-3 py-1.5 flex-shrink-0"
          >
            <svg
              className="w-3 h-3 text-blue-400"
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
            <span className="text-[10px] text-blue-400 font-semibold">
              PAN:
            </span>
            <span className="text-[10px] text-blue-700 font-mono font-bold tracking-widest">
              {pan.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* ── Two column grid ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 step-in"
        style={{ animationDelay: "0.05s" }}
      >
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
                    ? "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
                    : isValid
                      ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                      : hasPANMismatch
                        ? "border-orange-300 bg-orange-50/30 focus:border-orange-300 focus:ring-2 focus:ring-orange-50"
                        : "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50"
                  }`}
              />
              {touched && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center
                      ${hasPANMismatch ? "bg-orange-400" : "bg-red-400"}`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-300 mt-1.5">
              Format: 2 digits · 10 PAN · 1 digit · 1 letter · 1 digit
            </p>

            <PANMismatchBanner gstin={upper} pan={pan} />
          </div>

          {/* Status banner */}
          {touched && !hasPANMismatch && (
            <div
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
              ${isValid ? "bg-emerald-50 border-emerald-100" : "bg-red-50/60 border-red-100"}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${isValid ? "bg-emerald-500" : "bg-red-400"}`}
              >
                {isValid ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className={`text-xs font-semibold ${isValid ? "text-emerald-700" : "text-red-600"}`}
                >
                  {isValid ? "Valid GSTIN" : "Invalid GSTIN"}
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${isValid ? "text-emerald-500" : "text-red-400"}`}
                >
                  {isValid
                    ? "All validations passed. Ready to fetch details."
                    : "Fix the errors on the right to continue."}
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
                <RuleRow
                  key={i}
                  label={r.label}
                  passed={r.passed}
                  touched={touched}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-4 border-t border-gray-100">
            Your GSTIN is linked to your PAN and state code. Ensure it matches
            your GST certificate.
          </p>
        </div>
      </div>

      {/* ── Tips ── */}
      <div
        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 step-in"
        style={{ animationDelay: "0.1s" }}
      >
        <p
          className="text-[10px] font-bold text-slate-500 uppercase tracking-widest
          flex items-center gap-1.5 mb-2"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tips
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            "GSTIN is case-insensitive",
            "First 2 digits are your state code",
            "Characters 3–12 must match your PAN",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
              <span className="text-[11px] text-slate-500 leading-snug">
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA row ── */}
      <div
        className="flex items-center gap-3 step-in"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Preview pill */}
        <div className="flex-1 min-w-0">
          {upper.trim() ? (
            <div
              className="flex items-center gap-2 bg-gray-50 border border-gray-100
              rounded-xl px-4 py-2.5 overflow-hidden"
            >
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">
                GST
              </span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
              <span className="text-sm font-mono font-bold text-gray-800 tracking-widest">
                {upper}
              </span>
              {isValid && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-500 flex-shrink-0">
                    ✓ Valid
                  </span>
                </>
              )}
              {hasPANMismatch && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-orange-500 flex-shrink-0">
                    ⚠ PAN mismatch
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">
              Your GSTIN preview appears here
            </p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleFetch}
          disabled={!isValid || fetching || fetchDone}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${isValid && !fetching && !fetchDone
              ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white shadow-sm shadow-emerald-100"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
        >
          {fetching ? (
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
              Verifying…
            </>
          ) : fetchDone ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verified
            </>
          ) : (
            <>
              Fetch Details
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Toasts & Modal */}
      <SuccessToast
        show={successMsg}
        gstin={upper}
        onDismiss={() => setSuccessMsg(false)}
      />
      <ErrorModal
        error={showModal ? apiError : null}
        onDismiss={() => {
          setShowModal(false);
          setApiError(null);
        }}
        onRetry={() => {
          setShowModal(false);
          setApiError(null);
          handleFetch();
        }}
      />
      <ErrorToast
        error={!showModal && apiError ? apiError : null}
        onDismiss={() => setApiError(null)}
      />
    </div>
  );
}