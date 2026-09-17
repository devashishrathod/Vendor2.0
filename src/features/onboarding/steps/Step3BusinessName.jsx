import { useState } from "react";
import { validateBusinessName, validateShortName } from "../validation";
import {
  useOnboardingStore,
  BASIC_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { updateBusinessName } from "@/features/onboarding/services/api/brand.api";
import ErrorToast from "@/components/common/ErrorToast";
import Input from "@/components/common/Input";

// ── UI-only helpers ──────────────────────────────────────────────

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 text-red-500">
      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      <span className="text-[11px] font-medium leading-tight">{message}</span>
    </div>
  );
}

function SuccessNote({ text }) {
  return (
    <p className="text-[11px] text-emerald-500 mt-1.5 flex items-center gap-1 font-medium">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </p>
  );
}

function ShortNameBadge({ value }) {
  if (!value?.trim()) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200
      text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase mt-1.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
      </svg>
      {value.trim()}
    </span>
  );
}

function CharRing({ value, max }) {
  const pct = Math.min(value / max, 1);
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = value > max ? "#ef4444" : value > max * 0.8 ? "#f59e0b" : "#10b981";
  return (
    <svg width="26" height="26" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 14 14)"
        style={{ transition: "stroke-dasharray 0.2s, stroke 0.2s" }} />
      <text x="14" y="18" textAnchor="middle" fontSize="7" fill={color} fontWeight="700">
        {Math.max(max - value, 0)}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function Step3BusinessName() {
  const savedName = useOnboardingStore((s) => s.formData.businessName);
  const savedShortName = useOnboardingStore((s) => s.formData.shortName);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const currentSubStep = useOnboardingStore((s) => s.currentSubStep);
  const { setSubStep, setField, markComplete } = useOnboardingStore();

  const NAME_MAX = 60;
  const SHORT_MAX = 10;

  const [name, setName] = useState(savedName ?? "");
  const [nameError, setNameError] = useState(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [shortName, setShortName] = useState(savedShortName ?? "");
  const [shortError, setShortError] = useState(null);
  const [shortTouched, setShortTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameTouched) setNameError(validateBusinessName(e.target.value));
  };

  const handleShortChange = (e) => {
    const val = e.target.value.toUpperCase();
    setShortName(val);
    if (shortTouched) setShortError(validateShortName(val));
  };

  const handleContinue = async () => {
    setNameTouched(true);
    setShortTouched(true);
    const nErr = validateBusinessName(name);
    const sErr = validateShortName(shortName);
    setNameError(nErr);
    setShortError(sErr);
    if (nErr || sErr) return;

    setLoading(true);
    setApiError(null);
    try {
      await updateBusinessName({
        legalBusinessName: name.trim(),
        brandName: shortName.trim() || undefined,
      });

      setField("businessName", name.trim());
      setField("shortName", shortName.trim());
      markComplete(currentStep, currentSubStep);

      // ✅ Global toast — survives the step switch below, no setTimeout needed
      useOnboardingStore.getState().setToast("Business name updated successfully.");
      setSubStep(BASIC_SUB.REGISTRATION_STATUS);
    } catch (err) {
      setApiError({
        humanMessage: err.message ?? "Failed to save business name.",
        txnId: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleContinue(); };
  const nameValid = !validateBusinessName(name) && name.trim().length > 0;
  const shortValid = !validateShortName(shortName) && shortName.trim().length > 0;
  const canContinue = name.trim().length > 0 && !loading;

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative z-10 w-full">

        <style>{`
          @keyframes stepIn {
            from { opacity:0; transform:translateY(12px) scale(0.99); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          .step-in { animation: stepIn 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
        `}</style>

        <div className="flex gap-5 items-start flex-wrap">

          {/* ── Form card ── */}
          <div className="flex-1 min-w-0 bg-white border border-gray-50 rounded-2xl mt-4 sm:mt-8
            shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-6 step-in" style={{ animationDelay: "0s" }}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 step-in" style={{ animationDelay: "0s" }}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100
                flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight">Know Your Brand</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your business name as it appears on official documents.
                </p>
              </div>

              {/* Decorative badge — matches reference mockup */}
              <div className="relative hidden sm:flex items-center justify-center w-12 h-12
                rounded-2xl bg-emerald-50/70 flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                    d="M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6" />
                </svg>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500
                  border-2 border-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 step-in" style={{ animationDelay: "0.05s" }}>
              <Input
                label="Legal Business Name"
                required
                placeholder="e.g. Kentucky Fried Chicken"
                value={name}
                onChange={handleNameChange}
                onBlur={() => { setNameTouched(true); setNameError(validateBusinessName(name)); }}
                onKeyDown={handleKeyDown}
                touched={nameTouched}
                isValid={nameValid}
                maxLength={60}
                minLength={3}
                errorMsg={nameError}
                successMsg="Looks good!"
              />

              <Input
                label="Short Name"
                optional
                placeholder="KFC"
                value={shortName}
                onChange={handleShortChange}
                onBlur={() => { setShortTouched(true); setShortError(validateShortName(shortName)); }}
                onKeyDown={handleKeyDown}
                touched={shortTouched}
                isValid={shortValid}
                mono
                uppercase
                maxLength={10}
                minLength={2}
                errorMsg={shortError}
              />
            </div>

            {/* Tips panel */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4 step-in"
              style={{ animationDelay: "0.1s" }}>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest
                flex items-center gap-1.5 mb-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  "Use your registered brand name",
                  "At least 3 characters",
                  "No special symbols like @, #, &",
                  "Short name: 2–10 chars (e.g. KFC)",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                    <span className="text-[11px] text-gray-600 leading-snug">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-4" />

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 step-in" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0 order-2 sm:order-1">
                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100
                  flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {name.trim() || "—–"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {name.trim()
                      ? shortName.trim()
                        ? `Short name: ${shortName.trim()}`
                        : "Brand preview"
                      : "Your brand preview will appear here"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
                  tracking-wide transition-all duration-200 flex-shrink-0 order-1 sm:order-2 w-full sm:w-auto
                  ${canContinue
                    ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white shadow-sm shadow-emerald-100"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Footer note */}
            <div className="flex items-center gap-2 border-t border-gray-100 mt-4 pt-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[11px] text-gray-500">
                Don't worry, you can edit these details later from your profile settings.
              </p>
            </div>

          </div>

        </div>
      </div>

      <ErrorToast error={apiError} onDismiss={() => setApiError(null)} />

    </div>
  );
}