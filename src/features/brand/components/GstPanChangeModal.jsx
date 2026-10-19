import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";

import ConfirmModal from "@/components/common/ConfirmModal";
import Input from "@/components/common/Input";
import { validateGST, validatePAN } from "@/features/onboarding/validation";

import {
  updateBrandGstDetails,
  updateBrandPanDetails,
  verifyBrandGst,
  verifyBrandPan,
} from "../services/gstPanApi";

const joinParts = (parts) =>
  parts.filter((v) => v && String(v).trim() !== "" && v !== "NA").join(", ") || null;

// Rows shown on the review step. Field names are the verify responses'
// own (snake_case address keys included) — the same ones
// Step7PANReadOnly / Step9GSTReadOnly read.
const buildPanRows = (raw) => {
  const addr = raw.addressDetails || {};
  return [
    { label: "PAN", value: raw.pan },
    { label: "Full Name", value: raw.fullName || raw.lastName },
    { label: "PAN Type", value: raw.panType?.toUpperCase()?.trim() },
    { label: "Date of Incorporation", value: raw.dob },
    {
      label: "Address",
      value: joinParts([
        addr.building_name,
        addr.street_name,
        addr.locality,
        addr.city,
        addr.state,
        addr.pincode,
        addr.country,
      ]),
    },
  ];
};

const buildGstRows = (raw) => {
  const a = raw.address;
  return [
    { label: "GSTIN", value: raw.gstNumber },
    { label: "Legal Name", value: raw.legalName },
    { label: "Trade Name", value: raw.tradeName?.trim() },
    { label: "Constitution of Business", value: raw.constitutionOfBusiness },
    { label: "Taxpayer Type", value: raw.taxpayerType },
    { label: "Registration Status", value: raw.registrationStatus },
    { label: "Registration Date", value: raw.registrationDate },
    {
      label: "Nature of Business",
      value: Array.isArray(raw.natureOfBusiness) ? raw.natureOfBusiness.join(", ") : null,
    },
    {
      label: "Registered Address",
      value:
        a?.location?.trim() ||
        (a ? joinParts([a.building_number, a.building_name, a.city, a.district, a.state, a.pin]) : null),
    },
  ];
};

const CONFIG = {
  pan: {
    title: "Change PAN",
    label: "BUSINESS PAN",
    description: "10 characters · 5 letters · 4 numbers · 1 letter",
    placeholder: "e.g., ABCDE1234F",
    length: 10,
    errorMsg: "Enter a valid 10-digit PAN (e.g. ABCDE1234F)",
    successMsg: "Valid PAN format",
    verify: verifyBrandPan,
    buildRows: buildPanRows,
  },
  gst: {
    title: "Change GST",
    label: "BUSINESS GSTIN",
    description: "15 characters · Includes your registered PAN",
    placeholder: "e.g., 27ABCDE1234F1Z5",
    length: 15,
    errorMsg: "Enter a valid 15-digit GSTIN",
    successMsg: "Valid GSTIN format",
    verify: verifyBrandGst,
    buildRows: buildGstRows,
  },
};

/**
 * GstPanChangeModal
 * Change PAN / Change GST flow for Account Information → Business Profile:
 *   1. "enter"   — type the new number (same validation as onboarding)
 *   2. verify    — POST verify-pan / verify-gst
 *   3. "review"  — show the verified details
 *   4. confirm   — ConfirmModal
 *   5. save      — POST add-pan-details / add-gst-details
 *   6. "success" — Done → onUpdated() so the page reloads the brand
 *
 * @param {{
 *   type: 'pan' | 'gst',
 *   brandId: string,
 *   currentValue?: string,   // currently saved PAN / GSTIN
 *   currentPan?: string,     // saved PAN — GSTIN chars 3–12 must match it
 *   onClose: () => void,
 *   onUpdated?: () => void,
 * }} props
 */
export default function GstPanChangeModal({ type, brandId, currentValue, currentPan, onClose, onUpdated }) {
  const config = CONFIG[type];

  const [step, setStep] = useState("enter"); // "enter" | "review" | "success"
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [verified, setVerified] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validationError = type === "pan" ? validatePAN(value) : validateGST(value, currentPan);
  const isSameAsCurrent = !!currentValue && value === currentValue.toUpperCase();
  const isValid = !validationError && value.length === config.length;

  const rows = useMemo(() => {
    if (!verified) return [];
    const raw = verified?.data ?? verified;
    return config.buildRows(raw).filter((r) => r.value && r.value !== "—");
  }, [verified, config]);

  const handleChange = (e) => {
    const next = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, config.length);
    setValue(next);
    if (next) setTouched(true);
    setError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (isSameAsCurrent) {
      setError(`This is already your registered ${type === "pan" ? "PAN" : "GSTIN"}.`);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await config.verify(value);
      setVerified(res?.data ?? res);
      setStep("review");
    } catch (err) {
      console.error(`${type.toUpperCase()} verify failed:`, err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setShowConfirm(false);
    try {
      setLoading(true);
      setError("");
      if (type === "pan") {
        await updateBrandPanDetails(brandId, verified);
      } else {
        await updateBrandGstDetails(verified);
      }
      setStep("success");
    } catch (err) {
      console.error(`${type.toUpperCase()} update failed:`, err);
      setError(err.message || "Failed to update details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = useCallback(() => {
    onClose();
    onUpdated?.();
  }, [onClose, onUpdated]);

  const handleBackdrop = () => {
    if (loading) return;
    if (step === "success") handleDone();
    else onClose();
  };

  const label = type === "pan" ? "PAN" : "GSTIN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {step === "success" ? `${label} Updated` : config.title}
          </h3>
          <button
            type="button"
            onClick={handleBackdrop}
            disabled={loading}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {step === "enter" && (
            <form onSubmit={handleVerify}>
              <p className="text-xs text-gray-400 mb-4">
                {currentValue ? (
                  <>
                    Current {label}:{" "}
                    <span className="font-mono font-semibold text-gray-600 dark:text-gray-300">{currentValue}</span>.
                    Enter the new {label} to verify it.
                  </>
                ) : (
                  `Enter your ${label} to verify it.`
                )}
              </p>
              <Input
                label={config.label}
                description={config.description}
                required
                placeholder={config.placeholder}
                value={value}
                onChange={handleChange}
                touched={touched}
                isValid={isValid}
                mono
                uppercase
                maxLength={config.length}
                minLength={config.length}
                errorMsg={validationError || config.errorMsg}
                successMsg={config.successMsg}
              />
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!isValid || loading}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Verifying…" : "Verify & Fetch Details"}
              </button>
            </form>
          )}

          {step === "review" && (
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold px-2.5 py-1 mb-4">
                <CheckCircle2 size={13} />
                Verified
              </div>

              {rows.length > 0 ? (
                <div className="space-y-3 rounded-xl bg-gray-50/60 dark:bg-gray-700/40 p-4">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-gray-400 shrink-0">{r.label}</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 text-right break-words">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No details were returned for this {label}.</p>
              )}

              <p className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                Please confirm these details match your business records. Your saved {label} details will be replaced.
              </p>

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("enter"); setVerified(null); setError(""); }}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Change Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Updating…" : `Update ${label}`}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your {label} has been updated to <span className="font-mono font-semibold">{value}</span>.
              </p>
              <button
                type="button"
                onClick={handleDone}
                className="mt-5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmModal
            title={`Update ${label}?`}
            description={`Your saved ${label} details will be replaced with ${value}. Do you want to continue?`}
            onCancel={() => setShowConfirm(false)}
            onConfirm={handleSave}
          />
        </div>
      )}
    </div>
  );
}
