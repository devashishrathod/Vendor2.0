import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo1 from "@/assets/Logo1.jpg";
import ErrorToast from "@/components/common/ErrorToast";

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { getBrandById } from "../services/brandOutletApi"; // ← path apne project ke hisaab se adjust karo
import {
  systemVerify,
  acknowledgeApproval,
  verifyPAN,
  verifyGST,
  verifyBank,
} from "@/features/onboarding/services/api/verify.api";
import {
  updateBusinessName,
  updateRegistrationStatus,
  updateBusinessEntityType,
} from "@/features/onboarding/services/api/brand.api";
import {
  validateBusinessName,
  validatePAN,
  validateGST,
  validateBankDetails,
} from "@/features/onboarding/validation";

// Same 5 options Step5BusinessType.jsx offers during onboarding — kept in
// sync here so a rejected brand corrects its entity type with the same
// choices it originally saw.
const ENTITY_TYPE_OPTIONS = [
  { id: "pvt_ltd", label: "Private Limited Company", entityType: "PRIVATE_LIMITED" },
  { id: "llp", label: "LLP", entityType: "LLP" },
  { id: "partnership", label: "Partnership", entityType: "PARTNERSHIP" },
  { id: "proprietorship", label: "Proprietorship", entityType: "PROPRIETORSHIP" },
  { id: "others", label: "Others", entityType: "TRUST" },
];

// ── Small reusable local hooks — this page isn't becoming a wizard step,
// so these just wrap "edit a value, call one API, show the result" without
// any of the onboarding wizard's step/sub-step navigation. ──────────────

function useSavableField(initialValue, saveFn) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveFn(value);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [value, saveFn]);

  return { value, setValue, saving, saved, error, save };
}

function useVerifyField(initialValue, verifyFn, validateFn) {
  const [value, setValue] = useState(initialValue);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verify = useCallback(async () => {
    const validationError = validateFn?.(value);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }
    setVerifying(true);
    setError("");
    setResult(null);
    try {
      const data = await verifyFn(value);
      setResult(data?.data ?? data);
    } catch (err) {
      setError(err.message || "Verification failed. Please check the details and try again.");
    } finally {
      setVerifying(false);
    }
  }, [value, verifyFn, validateFn]);

  return { value, setValue, verifying, result, error, verify };
}

// ── Small presentational pieces ──────────────────────────────────────────

function FieldCard({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">{title}</p>
      {children}
    </div>
  );
}

const inputBase =
  "flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none transition-colors " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function SaveRow({ value, onChange, placeholder, onSave, saving, saved, error, children }) {
  return (
    <div>
      <div className="flex gap-2">
        {children ?? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputBase}
          />
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      {!error && saved && <p className="text-xs text-emerald-600 mt-1.5">✓ Updated</p>}
    </div>
  );
}

function VerifyRow({ value, onChange, placeholder, onVerify, verifying, result, error, resultLabel }) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={placeholder}
          className={inputBase}
        />
        <button
          type="button"
          onClick={onVerify}
          disabled={verifying}
          className="shrink-0 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "Verifying…" : "Verify"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      {!error && result && (
        <p className="text-xs text-emerald-600 mt-1.5">✓ {resultLabel(result)}</p>
      )}
    </div>
  );
}

export default function UnderReview() {
  const navigate = useNavigate();
  const { formData } = useOnboardingStore();

  // ⚠️ brandId abhi formData se maan liya hai — agar authStore me alag
  // key par store hai (jaise brand._id), to yahan wahi use karna.
  const brandId = formData?.brandId || formData?.brand?._id || null;

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ── Review status — GET /brands/onboarding/system-verify ────────────
  // { status, score, flags, remarks } — the closest thing to a status
  // history this backend exposes today (a single point-in-time result,
  // not a stored timeline).
  const [verification, setVerification] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(true);
  // Every non-2xx system-verify response (already approved, still waiting
  // on the admin, not a vendor, account deactivated, brand deleted, no
  // token, etc.) surfaces here and is shown via ErrorToast below.
  const [verifyError, setVerifyError] = useState(null);

  const fetchStatus = useCallback(async ({ silent } = {}) => {
    if (!silent) setVerifyLoading(true);
    try {
      const res = await systemVerify();
      setVerification(res?.data ?? res);
    } catch (err) {
      setVerifyError({ status: err.status, message: err.message });
    } finally {
      setVerifyLoading(false);
    }
  }, []);

  // ── Fetch brand from /brands/get?brandId=:brandId ──────────────
  const fetchBrand = useCallback(async ({ silent } = {}) => {
    if (!brandId) {
      setError("Brand ID missing — can't load review status.");
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const res = await getBrandById(brandId);
      const data = res?.data ?? res;

      console.log("[YourOutlet] fetchBrand ← response:", data);
      setBrand(data);

      // Backend's authoritative screen state lives on data.user.currentScreen
      if (data?.user?.currentScreen === "DASHBOARD") {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Couldn't fetch brand status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [brandId, navigate]);

  // ── Initial fetch on mount ──────────────────────────────────────
  useEffect(() => {
    fetchBrand();
    fetchStatus();
  }, [fetchBrand, fetchStatus]);

  // ── Also react if authStore's currentScreen updates live (e.g. via
  // socket/poll elsewhere in the app) ─────────────────────────────
  const authCurrentScreen = useAuthStore((s) => s.currentScreen);
  useEffect(() => {
    if (authCurrentScreen === "DASHBOARD") {
      navigate("/dashboard", { replace: true });
    }
  }, [authCurrentScreen, navigate]);

  const handleRecheck = () => {
    fetchBrand({ silent: true });
    fetchStatus({ silent: true });
  };

  // ── Map real API fields (see /brands/get response) ──────────────
  const brandData = {
    companyName: brand?.gst?.legalName || brand?.legalBusinessName || brand?.brandName || "—",
    merchantToken: brand?.merchantId || "—",
    gstNo: brand?.gst?.gstNumber || "—",
    panNo: brand?.pan?.pan || "—",
    createdAt: brand?.createdAt || null,
    logo: brand?.logo || null,   // ← ye line missing thi
  };

  const formattedDate = brandData.createdAt
    ? new Date(brandData.createdAt).toLocaleString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
    : "—";

  // ── Derived review status ────────────────────────────────────────
  const reviewStatus = verification?.status;
  const isApproved = reviewStatus === "APPROVED";
  const isPending = !reviewStatus || ["REVIEW", "MANUAL_REVIEW", "PENDING"].includes(reviewStatus);
  const isRejected = !isApproved && !isPending;

  const statusLabel = isApproved
    ? "Approved"
    : isRejected
      ? "Changes requested"
      : "Under review";

  // ── Approve → acknowledge → go to dashboard. Only ever called once
  // isApproved is true (the button only renders in that state). ──────
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackError, setAckError] = useState("");
  const handleGoToDashboard = async () => {
    setAcknowledging(true);
    setAckError("");
    try {
      await acknowledgeApproval();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setAckError(err.message || "Couldn't confirm approval. Please try again.");
      setAcknowledging(false);
    }
  };

  // ── Basic Details — corrections, shown only when rejected ─────────
  const businessNameField = useSavableField(formData?.businessName || "", async (value) => {
    const err = validateBusinessName(value);
    if (err) throw new Error(err);
    await updateBusinessName({ legalBusinessName: value });
  });
  const [isRegistered, setIsRegistered] = useState(formData?.isRegistered || "REGISTERED");
  const [registeredSaving, setRegisteredSaving] = useState(false);
  const [registeredSaved, setRegisteredSaved] = useState(false);
  const [registeredError, setRegisteredError] = useState("");
  const handleSaveRegistered = async () => {
    setRegisteredSaving(true); setRegisteredError(""); setRegisteredSaved(false);
    try {
      await updateRegistrationStatus({ status: isRegistered });
      setRegisteredSaved(true);
    } catch (err) {
      setRegisteredError(err.message || "Something went wrong. Please try again.");
    } finally {
      setRegisteredSaving(false);
    }
  };
  const [businessType, setBusinessType] = useState(
    ENTITY_TYPE_OPTIONS.find((o) => o.id === formData?.businessType)?.id || "pvt_ltd"
  );
  const [businessTypeSaving, setBusinessTypeSaving] = useState(false);
  const [businessTypeSaved, setBusinessTypeSaved] = useState(false);
  const [businessTypeError, setBusinessTypeError] = useState("");
  const handleSaveBusinessType = async () => {
    setBusinessTypeSaving(true); setBusinessTypeError(""); setBusinessTypeSaved(false);
    try {
      const entityType = ENTITY_TYPE_OPTIONS.find((o) => o.id === businessType)?.entityType;
      await updateBusinessEntityType({ entityType });
      setBusinessTypeSaved(true);
    } catch (err) {
      setBusinessTypeError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusinessTypeSaving(false);
    }
  };

  // ── Business Details — PAN / GST / Bank re-verify, shown only when
  // rejected. These call the same verify-pan/verify-gst/verify-bank
  // endpoints the onboarding wizard uses and show the result inline —
  // they don't resubmit anything to the brand record (there's no
  // confirmed endpoint for that outside the onboarding wizard's own
  // step flow), so use this to confirm corrected details are valid.
  const panField = useVerifyField(formData?.pan || "", verifyPAN, validatePAN);
  const gstField = useVerifyField(formData?.gstin || "", verifyGST, (v) => validateGST(v, panField.value));
  const [bankFields, setBankFields] = useState({
    accountNumber: formData?.bankAccount || "",
    ifsc: formData?.bankIfsc || "",
    accountHolderName: formData?.bankHolderName || "",
  });
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankResult, setBankResult] = useState(null);
  const [bankError, setBankError] = useState("");
  const handleVerifyBank = async () => {
    const errors = validateBankDetails(bankFields);
    if (errors) {
      setBankError(Object.values(errors)[0]);
      setBankResult(null);
      return;
    }
    setBankVerifying(true); setBankError(""); setBankResult(null);
    try {
      const data = await verifyBank({ accountNumber: bankFields.accountNumber, ifsc: bankFields.ifsc });
      setBankResult(data?.data ?? data);
    } catch (err) {
      setBankError(err.message || "Bank verification failed. Please check the details and try again.");
    } finally {
      setBankVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading review status…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img
              src={logo1}
              alt="Trydood"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="text-emerald-400 text-xs font-bold hidden">T</span>
          </div>
        </div>

        <div className="w-[34px] h-[34px] bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
        <p className="text-xs text-gray-400 mb-6">Overview · Showcase your listing outlet</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* ── Status History — built from what's actually available:
            when this was submitted, and the latest system-verify result.
            There's no backend timeline/audit-log endpoint yet, so this
            is a 2-entry history, not a full log. Hidden once approved. */}
        {!isApproved && (
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-4 mb-5">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
              Status History
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">Submitted for review</p>
                  <p className="text-xs text-gray-400">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    isRejected ? "bg-rose-400" : "bg-amber-400"
                  }`}
                />
                <div>
                  <p className="text-sm text-gray-700">
                    {verifyLoading ? "Checking current status…" : statusLabel}
                  </p>
                  {!verifyLoading && verification?.remarks?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {verification.remarks.map((remark, i) => (
                        <li key={i} className="text-xs text-gray-400">
                          {remark}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert banner */}
        {isApproved ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 mb-5">
            <p className="text-sm font-semibold text-emerald-800 mb-1">
              🎉 Welcome aboard — your listing is approved!
            </p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              You're all set. Head to your dashboard to start managing your outlet.
            </p>
          </div>
        ) : (
          <div className={`rounded-xl px-4 py-3.5 mb-5 border ${
            isRejected ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
          }`}>
            <p className={`text-sm font-semibold mb-1 ${isRejected ? "text-rose-800" : "text-amber-800"}`}>
              {isRejected ? "Some details need to be corrected." : "Your listing is under review."}
            </p>
            <p className={`text-xs leading-relaxed ${isRejected ? "text-rose-700" : "text-amber-700"}`}>
              {isRejected
                ? "Please fix the details below and re-verify so we can review your listing again."
                : "Trydood will review your listing details and verify them soon. If there are any errors, your submission will be put on hold. The Trydood team will contact you shortly."}
            </p>
          </div>
        )}

        {/* Outlet card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={brandData.logo}
                alt="Trydood"
                className="w-12 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="text-emerald-400 text-xs font-bold hidden">T</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {brandData.companyName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Merchant Token: {brandData.merchantToken} &nbsp;·&nbsp; <br />
                Created on: {formattedDate}
              </p>
            </div>

            {isApproved ? (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button
                  onClick={handleGoToDashboard}
                  disabled={acknowledging}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600
                    text-white text-xs font-semibold flex items-center justify-center gap-1.5
                    transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {acknowledging ? "Opening…" : "Go to Dashboard"}
                </button>
                {ackError && <p className="text-xs text-red-500">{ackError}</p>}
              </div>
            ) : (
              <button
                onClick={handleRecheck}
                disabled={refreshing}
                className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-lg bg-white
                  hover:bg-gray-50 text-gray-600 text-xs font-semibold
                  transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
              >
                {refreshing ? "Checking…" : "Recheck"}
              </button>
            )}
          </div>
        </div>

        {/* ── Rejected: Basic Details + Business Details correction
            panels. Not a new page — just input rows in cards, with the
            verified/saved result shown right below each one. ────────── */}
        {isRejected && (
          <div className="mt-5">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
              Basic Details
            </p>
            <FieldCard title="Business Name">
              <SaveRow
                value={businessNameField.value}
                onChange={businessNameField.setValue}
                placeholder="Registered business name"
                onSave={businessNameField.save}
                saving={businessNameField.saving}
                saved={businessNameField.saved}
                error={businessNameField.error}
              />
            </FieldCard>

            <FieldCard title="Registered">
              <SaveRow
                onSave={handleSaveRegistered}
                saving={registeredSaving}
                saved={registeredSaved}
                error={registeredError}
              >
                <select
                  value={isRegistered}
                  onChange={(e) => setIsRegistered(e.target.value)}
                  className={inputBase}
                >
                  <option value="REGISTERED">Registered</option>
                  <option value="UNREGISTERED">Unregistered</option>
                </select>
              </SaveRow>
            </FieldCard>

            <FieldCard title="Business Type">
              <SaveRow
                onSave={handleSaveBusinessType}
                saving={businessTypeSaving}
                saved={businessTypeSaved}
                error={businessTypeError}
              >
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={inputBase}
                >
                  {ENTITY_TYPE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </SaveRow>
            </FieldCard>

            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 mt-6">
              Business Details
            </p>
            <FieldCard title="PAN">
              <VerifyRow
                value={panField.value}
                onChange={panField.setValue}
                placeholder="ABCDE1234F"
                onVerify={panField.verify}
                verifying={panField.verifying}
                result={panField.result}
                error={panField.error}
                resultLabel={(r) => `PAN verified${r?.full_name ? ` — ${r.full_name}` : r?.fullName ? ` — ${r.fullName}` : ""}`}
              />
            </FieldCard>

            <FieldCard title="GST">
              <VerifyRow
                value={gstField.value}
                onChange={gstField.setValue}
                placeholder="22ABCDE1234F1Z5"
                onVerify={gstField.verify}
                verifying={gstField.verifying}
                result={gstField.result}
                error={gstField.error}
                resultLabel={(r) => `GST verified${r?.legalName ? ` — ${r.legalName}` : ""}`}
              />
            </FieldCard>

            <FieldCard title="Bank Account">
              <div className="space-y-2">
                <input
                  value={bankFields.accountNumber}
                  onChange={(e) => setBankFields((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Account number"
                  className={`${inputBase} w-full`}
                />
                <input
                  value={bankFields.ifsc}
                  onChange={(e) => setBankFields((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                  placeholder="IFSC code"
                  className={`${inputBase} w-full`}
                />
                <input
                  value={bankFields.accountHolderName}
                  onChange={(e) => setBankFields((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Account holder name"
                  className={`${inputBase} w-full`}
                />
                <button
                  type="button"
                  onClick={handleVerifyBank}
                  disabled={bankVerifying}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bankVerifying ? "Verifying…" : "Verify"}
                </button>
                {bankError && <p className="text-xs text-red-500">{bankError}</p>}
                {!bankError && bankResult && (
                  <p className="text-xs text-emerald-600">
                    ✓ Bank account verified{bankResult?.bank_name ? ` — ${bankResult.bank_name}` : ""}
                  </p>
                )}
              </div>
            </FieldCard>
          </div>
        )}

        <button
          onClick={() => navigate("/manage-outlet")} // ← apna actual route lagana
          className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700
    text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
        >
          Manage Your Outlet
        </button>

        {/* ── Polling indicator — hidden once approved or rejected ── */}
        {isPending && (
          <p className="text-center text-xs text-gray-300 mt-8 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Checking review status…
          </p>
        )}
      </div>

      <ErrorToast error={verifyError} onDismiss={() => setVerifyError(null)} />
    </div>
  );
}
