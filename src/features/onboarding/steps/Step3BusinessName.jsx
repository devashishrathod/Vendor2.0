import { useState } from "react";
import { validateBusinessName, validateShortName } from "../validation";
import {
  useOnboardingStore,
  BASIC_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { updateBusinessName } from "@/features/onboarding/services/api/brand.api";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorToast from "@/components/common/ErrorToast";

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 text-red-500">
      <svg
        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-[11px] font-medium leading-tight">{message}</span>
    </div>
  );
}

function SuccessNote({ text }) {
  return (
    <p className="text-[11px] text-emerald-500 mt-1.5 flex items-center gap-1 font-medium">
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
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
      {text}
    </p>
  );
}

function CharRing({ value, max }) {
  const pct = Math.min(value / max, 1);
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color =
    value > max ? "#ef4444" : value > max * 0.8 ? "#f59e0b" : "#10b981";
  return (
    <svg width="26" height="26" viewBox="0 0 28 28">
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="2.5"
      />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
        style={{ transition: "stroke-dasharray 0.2s, stroke 0.2s" }}
      />
      <text
        x="14"
        y="18"
        textAnchor="middle"
        fontSize="7"
        fill={color}
        fontWeight="700"
      >
        {Math.max(max - value, 0)}
      </text>
    </svg>
  );
}

function ShortNameBadge({ value }) {
  if (!value?.trim()) return null;
  return (
    <span
      className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200
      text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase mt-1.5"
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
          strokeWidth={2.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z"
        />
      </svg>
      {value.trim()}
    </span>
  );
}

function InputField({
  label,
  optional,
  placeholder,
  value,
  onChange,
  onBlur,
  onKeyDown,
  maxLength,
  error,
  valid,
  charMax,
  uppercase,
  validMessage,
  validNode,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        {label}
        {!optional && <span className="text-red-400">*</span>}
        {optional && (
          <span
            className="bg-gray-100 text-gray-400 text-[9px] font-semibold
            px-1.5 py-0.5 rounded normal-case tracking-normal"
          >
            Optional
          </span>
        )}
      </label>
      <div
        className={`relative rounded-xl transition-all duration-200 ${focused ? "shadow-sm" : ""}`}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl text-sm text-gray-800
            placeholder:text-gray-300 outline-none transition-all duration-200
            ${uppercase ? "font-bold tracking-widest uppercase" : "font-normal"}
            ${
              error
                ? "border-red-200 bg-red-50/30 focus:border-red-300 focus:ring-2 focus:ring-red-50"
                : valid
                  ? "border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                  : "border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50"
            }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {value.length > 0 ? (
            <CharRing value={value.length} max={charMax} />
          ) : (
            <span className="text-gray-300 text-[10px] font-medium">
              {charMax}
            </span>
          )}
        </div>
      </div>
      <div className="min-h-[22px]">
        {error ? (
          <ErrorMessage message={error} />
        ) : valid && validNode ? (
          validNode
        ) : valid && validMessage ? (
          <SuccessNote text={validMessage} />
        ) : null}
      </div>
    </div>
  );
}

export default function Step3BusinessName() {
  const { setSubStep, setField } = useOnboardingStore();

  const NAME_MAX = 60;
  const SHORT_MAX = 10;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [shortName, setShortName] = useState("");
  const [shortError, setShortError] = useState(null);
  const [shortTouched, setShortTouched] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

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
      setSuccessMsg("Business name updated successfully.");
      setTimeout(() => {
        setSubStep(BASIC_SUB.REGISTRATION_STATUS);
      }, 1500);
    } catch (err) {
      setApiError({
        status: err.status,
        message: err.message,
        txnId: err.txnId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleContinue();
  };

  const nameValid = !validateBusinessName(name) && name.trim().length > 0;
  const shortValid =
    !validateShortName(shortName) && shortName.trim().length > 0;
  const canContinue = name.trim().length > 0 && !loading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <style>{`
        @keyframes stepIn {
          from { opacity:0; transform:translateY(12px) scale(0.99); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .step-in { animation: stepIn 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 step-in">
        <div
          className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">
            Know Your Brand
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Enter your business name as it appears on official documents.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div
        className="grid grid-cols-2 gap-4 mb-4 step-in"
        style={{ animationDelay: "0.05s" }}
      >
        <InputField
          label="Legal Business Name"
          placeholder="e.g. Kentucky Fried Chicken"
          value={name}
          onChange={handleNameChange}
          onBlur={() => {
            setNameTouched(true);
            setNameError(validateBusinessName(name));
          }}
          onKeyDown={handleKeyDown}
          maxLength={NAME_MAX + 10}
          charMax={NAME_MAX}
          error={nameError}
          valid={nameValid}
          validMessage="Looks good!"
        />
        <InputField
          label="Short Name"
          optional
          placeholder="KFC"
          value={shortName}
          onChange={handleShortChange}
          onBlur={() => {
            setShortTouched(true);
            setShortError(validateShortName(shortName));
          }}
          onKeyDown={handleKeyDown}
          maxLength={SHORT_MAX + 2}
          charMax={SHORT_MAX}
          error={shortError}
          valid={shortValid}
          uppercase
          validNode={<ShortNameBadge value={shortName} />}
        />
      </div>

      {/* Tips — compact card */}
      {/* Tips — compact card */}
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
            "Use your registered brand name",
            "At least 3 characters",
            "No special symbols like @, #, &",
            "Short name: 2–10 chars (e.g. KFC)",
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

      {/* API Error */}
      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 step-in">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* CTA row */}
      <div
        className="flex items-center gap-3 step-in"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Preview */}
        <div className="flex-1 min-w-0">
          {name.trim() ? (
            <div
              className="flex items-center gap-2 bg-gray-50 border border-gray-100
              rounded-xl px-3 py-2.5 overflow-hidden"
            >
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">
                Preview
              </span>
              <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-800 truncate">
                {name.trim()}
              </span>
              {shortName.trim() && (
                <>
                  <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
                  <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase flex-shrink-0">
                    {shortName.trim()}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 pl-1">
              Your brand preview appears here
            </p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
            tracking-wide transition-all duration-200 flex-shrink-0
            ${
              canContinue
                ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white shadow-sm shadow-emerald-100"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
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
              Saving…
            </>
          ) : (
            <>
              Continue
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

      <SuccessToast
        message={successMsg}
        onDismiss={() => setSuccessMsg(null)}
      />
      <ErrorToast error={apiError} onDismiss={() => setApiError(null)} />
    </div>
  );
}
