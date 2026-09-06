import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Ticket,
  CalendarDays,
  ArrowRight,
  PartyPopper,
  Sparkle,
  BadgeCheck,
  TrendingUp,
  ShieldCheck,
  Headset,
  ChevronRight,
} from "lucide-react";
import logo1 from "@/assets/Logo1.jpg";
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";

// "SYSTEM_VERIFIED" → "System Verified", "REJECTED" → "Rejected" — used
// for every raw SCREAMING_SNAKE_CASE enum the verification-history API
// returns (action, newStatus, previousStatus, performedByType), instead
// of printing them verbatim in the Status History timeline.
function prettifyStatus(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Scattered, gently-twinkling sparkles/confetti for the "approved" hero
// below — a settled/celebratory feel rather than actively falling pieces.
const REVIEW_CONFETTI_COLORS = ["#f472b6", "#818cf8", "#34d399", "#fb923c", "#facc15", "#60a5fa"];
const REVIEW_CONFETTI_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  color: REVIEW_CONFETTI_COLORS[i % REVIEW_CONFETTI_COLORS.length],
  left: Math.random() * 100,
  top: Math.random() * 90,
  size: Math.random() * 8 + 6,
  duration: Math.random() * 2 + 2,
  delay: Math.random() * 3,
  rotate: Math.random() * 360,
  opacity: Math.random() * 0.4 + 0.4,
  isSparkle: Math.random() > 0.5,
}));

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { getBrandById, getBrandVerificationHistory, updateBrandDetails } from "../services/brandOutletApi"; // ← path apne project ke hisaab se adjust karo
import {
  acknowledgeApproval,
  systemVerify,
  verifyPAN,
  verifyGST,
  verifyBank,
} from "@/features/onboarding/services/api/verify.api";
import {
  updateBusinessName,
  updateBusinessEntityType,
} from "@/features/onboarding/services/api/brand.api";
import {
  submitVerifiedPanDetails,
  submitVerifiedGstDetails,
  submitVerifiedBankDetails,
} from "@/features/onboarding/services/api/verificationDetails.api";
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
  // The last-known-saved value — compared against `value` to decide
  // whether the row shows an inert pencil icon (nothing to save) or an
  // active "Save" button (edited, not yet saved).
  const [baseline, setBaseline] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Used by the prefill-from-brand effect: sets value AND baseline
  // together so the field starts clean against the real saved value,
  // instead of looking "dirty" the instant real data loads.
  const setPrefilled = useCallback((v) => {
    setValue(v);
    setBaseline(v);
  }, []);

  // Cleared back to empty shows the pencil icon again, not Save — an
  // empty value is never a real edit worth saving (and would just fail
  // validation), so it falls back to the inert state instead of looking
  // like there's a pending change.
  const isDirty = value !== baseline && String(value ?? "").trim() !== "";

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveFn(value);
      setBaseline(value);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [value, saveFn]);

  return { value, setValue, setPrefilled, isDirty, saving, saved, error, save };
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

  // Clears the verified result so the field flips back to the editable
  // input+Verify UI ("Change Details") without touching the typed value.
  const reset = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  return { value, setValue, verifying, result, error, verify, reset };
}

// Generic "call this one API, track saving/error" wrapper for the
// submitVerified*Details calls below — same shape as useSavableField's
// save(), just not tied to a text field.
function useSubmitAction(submitFn) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitFn();
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitFn]);

  return { submitting, error, run };
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

// Collapsible field row for Business Details (PAN/GST/Bank) — header is a
// single horizontal line (title + summary + chevron); the input/verify
// content only renders once expanded. Each card has its own border, so
// stacking them (mb-3) reads as a separated list.
function AccordionFieldCard({ title, summary, defaultOpen = false, collapseSignal, children }) {
  const [open, setOpen] = useState(defaultOpen);
  // Bump collapseSignal (e.g. after a successful "Save Details") to force
  // this back closed — it goes back to reading like a plain summary row,
  // the same as before the vendor started editing it.
  useEffect(() => {
    if (collapseSignal) setOpen(false);
  }, [collapseSignal]);
  return (
    <div className="bg-white border border-gray-100 rounded-xl mb-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-700 shrink-0">{title}</span>
          {summary && <span className="text-xs text-gray-400 truncate">{summary}</span>}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>}
    </div>
  );
}

const inputBase =
  "flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none transition-colors " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

// Just the input (or a custom control via `children`, e.g. a <select>)
// plus its own error/saved message — no per-field button. Basic Details'
// three fields share ONE combined save button below them instead (see
// handleSaveBasicDetails), rather than one button per field.
function PlainFieldRow({ value, onChange, placeholder, error, saved, children }) {
  return (
    <div>
      {children ?? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} w-full`}
        />
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      {!error && saved && <p className="text-xs text-emerald-600 mt-1.5">✓ Updated</p>}
    </div>
  );
}

// isDirty=true (value changed, not yet saved) shows an active "Save"
// button. isDirty=false shows an inert pencil icon instead — nothing to
// save yet, it's just a visual cue that the field is editable.
function SaveButton({ onSave, saving, isDirty = true, className = "" }) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving || !isDirty}
      title={isDirty ? "Save changes" : "No changes to save"}
      className={
        (isDirty
          ? "px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          : "w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed") +
        " " + className
      }
    >
      {saving ? (
        "Saving…"
      ) : isDirty ? (
        "Save"
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )}
    </button>
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

// Shown once a field's verify() call succeeds — a read-only summary of
// the verified data (every row the corresponding onboarding wizard step
// shows, minus the decorative icon badges), a "Change Details" button to
// go back to the editable input, and a "Save Details" button that POSTs
// the exact payload the wizard's read-only step would (submitVerified*
// in verificationDetails.api.js), so this really does persist to the
// brand record instead of only confirming the value is valid.
function VerifiedDetailCard({ rows, onChangeDetails, onSave, saving, saveError }) {
  const visibleRows = rows.filter((r) => r.value && r.value !== "—");
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 mb-3">
        <svg className="w-3 h-3 fill-emerald-500" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.08L6.7 12.2l1.41-1.42 2.48 2.49 5.31-5.32 1.41 1.42-6.72 6.71z" />
        </svg>
        Verified
      </div>

      {visibleRows.length > 0 && (
        <div className="space-y-2 mb-3">
          {visibleRows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3">
              <span className="text-xs text-gray-400 shrink-0">{r.label}</span>
              <span className="text-xs font-semibold text-gray-800 text-right max-w-[60%] break-words">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {saveError && <p className="text-xs text-red-500 mb-2">{saveError}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onChangeDetails}
          disabled={saving}
          className="flex-1 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          Change Details
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Details"}
        </button>
      </div>
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

  // ── Review status — GET /brands/verifications/history?brandId= ──────
  // A real, ordered history of every admin action taken on this brand's
  // verification (submit/approve/reject attempts), not just a single
  // point-in-time check. Empty list = no action taken yet (still pending).
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(true);
  // Any failed history fetch (auth issues, brand deleted, etc.) surfaces
  // here and is shown via ErrorToast below.
  const [verifyError, setVerifyError] = useState(null);

  const fetchStatus = useCallback(async ({ silent } = {}) => {
    if (!brandId) return;
    if (!silent) setVerifyLoading(true);
    try {
      const res = await getBrandVerificationHistory({ brandId });
      const list = res?.data?.data ?? res?.data ?? [];
      setVerificationHistory(Array.isArray(list) ? list : []);
    } catch (err) {
      setVerifyError({ status: err.status, message: err.message });
    } finally {
      setVerifyLoading(false);
    }
  }, [brandId]);

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
        navigate("/analysis-report", { replace: true });
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
      navigate("/analysis-report", { replace: true });
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

  // ── Derived review status — from the most recent verification-history
  // entry's `newStatus`, NOT `action`. ⚠️ FIXED: this used to read
  // `entry.action` instead, but `action` just names the KIND of action
  // taken (e.g. "SYSTEM_VERIFIED") — it does NOT mean the outcome was a
  // pass. A system-verify attempt can itself result in newStatus
  // "REJECTED" (see the real history entry that surfaced this: action
  // "SYSTEM_VERIFIED", previousStatus "PENDING", newStatus "REJECTED").
  // Reading `action` meant a rejected brand silently fell through to
  // isPending, showing the amber "under review" banner instead of the
  // rose "needs correction" one — and never showing the correction
  // fields below at all. `newStatus` is the actual resulting state.
  // No entries yet (an empty history) means nothing's been actioned,
  // i.e. still pending.
  const sortedHistory = [...verificationHistory].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const latestEntry = sortedHistory[0] || null;
  const reviewStatus = latestEntry?.newStatus || latestEntry?.action;
  const isApproved = reviewStatus === "APPROVED";
  // A revoked brand (brand.isRevoked, confirmed field — separate from the
  // approve/reject history, since revoke can happen to an already-approved
  // brand later) gets the exact same "needs correction" treatment as a
  // rejected one — same banner, same Basic/Business Details correction
  // panels — rather than a distinct case.
  const isRejected = reviewStatus === "REJECTED" || !!brand?.isRevoked;
  const isPending = !isApproved && !isRejected;

  // ── Approve → acknowledge → go to dashboard. Only ever called once
  // isApproved is true (the button only renders in that state). ──────
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackError, setAckError] = useState("");
  const handleGoToDashboard = async () => {
    setAcknowledging(true);
    setAckError("");
    try {
      await acknowledgeApproval();
      navigate("/analysis-report", { replace: true });
    } catch (err) {
      setAckError(err.message || "Couldn't confirm approval. Please try again.");
      setAcknowledging(false);
    }
  };

  // ── Basic Details — corrections, shown only when rejected. Initial
  // values start empty and get filled in by the prefill effect below once
  // the real brand record loads — `formData` (the onboarding wizard's
  // local draft state) is usually stale/empty by the time a brand reaches
  // "under review", so it's not a reliable prefill source here.
  const businessNameField = useSavableField("", async (value) => {
    const err = validateBusinessName(value);
    if (err) throw new Error(err);
    await updateBusinessName({ legalBusinessName: value });
  });
  // Brand short name — separate from the legal business name above, saved
  // via the generic PUT /brands/update?brandId= endpoint's `brandName`
  // field (confirmed from Postman), not the onboarding add-basic-details
  // endpoint businessNameField uses.
  const brandShortNameField = useSavableField("", async (value) => {
    await updateBrandDetails(brandId, { brandName: value });
  });
  const [businessType, setBusinessType] = useState("pvt_ltd");
  const [businessTypeBaseline, setBusinessTypeBaseline] = useState("pvt_ltd");
  const [businessTypeSaved, setBusinessTypeSaved] = useState(false);
  const [businessTypeError, setBusinessTypeError] = useState("");
  const businessTypeDirty = businessType !== businessTypeBaseline;
  const handleSaveBusinessType = async () => {
    setBusinessTypeError(""); setBusinessTypeSaved(false);
    try {
      const entityType = ENTITY_TYPE_OPTIONS.find((o) => o.id === businessType)?.entityType;
      await updateBusinessEntityType({ entityType });
      setBusinessTypeBaseline(businessType);
      setBusinessTypeSaved(true);
    } catch (err) {
      setBusinessTypeError(err.message || "Something went wrong. Please try again.");
    }
  };

  // Tracks whether ANYTHING has actually been saved this session — once
  // true, a "Submit for Review" button appears (rejected case only) that
  // re-runs system-verify to resubmit the corrected brand for review.
  const [hasUpdated, setHasUpdated] = useState(false);

  // One combined Save for all of Basic Details instead of a button per
  // field — only the fields that actually changed get saved; each still
  // shows its own inline error/✓-Updated message via PlainFieldRow.
  const [basicSaving, setBasicSaving] = useState(false);
  const basicDetailsDirty = businessNameField.isDirty || brandShortNameField.isDirty || businessTypeDirty;
  const handleSaveBasicDetails = async () => {
    setBasicSaving(true);
    try {
      await Promise.all([
        businessNameField.isDirty ? businessNameField.save() : null,
        brandShortNameField.isDirty ? brandShortNameField.save() : null,
        businessTypeDirty ? handleSaveBusinessType() : null,
      ]);
      setHasUpdated(true);
    } finally {
      setBasicSaving(false);
    }
  };

  // ── Business Details — PAN / GST / Bank re-verify, shown only when
  // rejected. Verifying just confirms the corrected value is valid
  // (verifyPAN/GST/Bank, same as onboarding); once verified, a read-only
  // VerifiedDetailCard appears and "Save Details" persists it to the
  // brand record via the exact same payload format + endpoint the
  // onboarding wizard's read-only step (Step7/9/12) uses — see
  // verificationDetails.api.js.
  const panField = useVerifyField("", verifyPAN, validatePAN);
  const gstField = useVerifyField("", verifyGST, (v) => validateGST(v, panField.value));
  const [bankFields, setBankFields] = useState({
    accountNumber: "",
    ifsc: "",
    accountHolderName: "",
  });
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankResult, setBankResult] = useState(null);
  const [bankError, setBankError] = useState("");
  const resetBank = () => {
    setBankResult(null);
    setBankError("");
  };

  const [verifySuccessMsg, setVerifySuccessMsg] = useState("");
  const panSubmit = useSubmitAction(() => submitVerifiedPanDetails(brandId, panField.result));
  const gstSubmit = useSubmitAction(() => submitVerifiedGstDetails(gstField.result));
  const bankSubmit = useSubmitAction(() =>
    submitVerifiedBankDetails(bankResult, { enteredAccountNumber: bankFields.accountNumber })
  );
  // Bumped after a successful "Save Details" so the field's
  // AccordionFieldCard collapses back closed — it goes back to reading
  // like a plain summary row, same as before the vendor opened it to fix
  // something, instead of staying pinned open on the Verified card.
  const [panCollapse, setPanCollapse] = useState(0);
  const [gstCollapse, setGstCollapse] = useState(0);
  const [bankCollapse, setBankCollapse] = useState(0);
  const handleSavePanDetails = async () => {
    if (await panSubmit.run()) {
      setVerifySuccessMsg("PAN details saved successfully.");
      setHasUpdated(true);
      setPanCollapse((n) => n + 1);
    }
  };
  const handleSaveGstDetails = async () => {
    if (await gstSubmit.run()) {
      setVerifySuccessMsg("GST details saved successfully.");
      setHasUpdated(true);
      setGstCollapse((n) => n + 1);
    }
  };
  const handleSaveBankDetails = async () => {
    if (await bankSubmit.run()) {
      setVerifySuccessMsg("Bank details saved successfully.");
      setHasUpdated(true);
      setBankCollapse((n) => n + 1);
    }
  };

  // ── Resubmit for review — the "Submit" action after fixing rejected
  // details. Re-runs the same GET /brands/onboarding/system-verify score
  // check the onboarding wizard uses, then refreshes both the brand and
  // the verification history so Status History picks up the new attempt.
  const [submittingReview, setSubmittingReview] = useState(false);
  const handleSubmitForReview = async () => {
    setSubmittingReview(true);
    try {
      await systemVerify();
      setVerifySuccessMsg("Submitted for review.");
      setHasUpdated(false);
      await Promise.all([fetchBrand({ silent: true }), fetchStatus({ silent: true })]);
    } catch (err) {
      setVerifyError({ status: err.status, message: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Prefill Basic/Business Details from the real brand record once it
  // loads — runs a single time (guarded by prefilledRef) so a later
  // "Recheck" refetch doesn't clobber whatever the vendor is mid-editing.
  // NOTE: businessRegistrationStatus/businessEntityType are confirmed as
  // the field names brand.api.js WRITES — not independently confirmed on
  // this GET response, but REST APIs normally read back what they wrote.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!brand || prefilledRef.current) return;
    prefilledRef.current = true;

    businessNameField.setPrefilled(brand.legalBusinessName || brand.brandName || "");
    brandShortNameField.setPrefilled(brand.brandName || "");
    const prefilledBusinessType =
      ENTITY_TYPE_OPTIONS.find((o) => o.entityType === brand.businessEntityType)?.id || "pvt_ltd";
    setBusinessType(prefilledBusinessType);
    setBusinessTypeBaseline(prefilledBusinessType);
    panField.setValue(brand.pan?.pan || "");
    gstField.setValue(brand.gst?.gstNumber || "");
    setBankFields({
      accountNumber: brand.bank?.accountNumber || "",
      ifsc: brand.bank?.ifscCode || "",
      accountHolderName: brand.bank?.accountHolderName || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
        <p className="text-xs mb-6 flex items-center gap-1.5">
          <span className="font-semibold text-emerald-600">Overview</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-gray-400">Showcase your listing outlet</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* ── Status History — real timeline from GET /brands/verifications/
            history: every submit/approve/reject action taken on this
            brand, oldest first, plus the original submission. A single
            connecting line runs through every dot so it reads as one
            continuous timeline instead of a loose list. Hidden once
            approved. */}
        {!isApproved && (() => {
          const timelineItems = [
            {
              id: "submitted",
              dotColor: "bg-gray-300",
              ringColor: "ring-gray-100",
              title: "Submitted for review",
              date: formattedDate,
            },
            ...[...sortedHistory].reverse().map((entry) => {
              // ⚠️ FIXED: color/status now derive from `newStatus` (the
              // actual resulting state), not `action` (just the kind of
              // action taken, e.g. "SYSTEM_VERIFIED" — which can itself
              // result in newStatus "REJECTED", as it did here).
              const status = entry.newStatus || entry.action;
              const dotColor =
                status === "REJECTED" ? "bg-rose-500"
                  : status === "APPROVED" ? "bg-emerald-500"
                    : "bg-amber-400";
              const ringColor =
                status === "REJECTED" ? "ring-rose-100"
                  : status === "APPROVED" ? "ring-emerald-100"
                    : "ring-amber-100";
              const badgeClass =
                status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-200"
                  : status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-amber-50 text-amber-600 border-amber-200";

              return {
                id: entry._id,
                dotColor,
                ringColor,
                // "SYSTEM_VERIFIED" → "System Verified"
                actionLabel: prettifyStatus(entry.action) || "Status updated",
                attemptNumber: entry.attemptNumber,
                performedByType: entry.performedByType,
                statusLabel: prettifyStatus(status),
                badgeClass,
                transition: entry.previousStatus && entry.newStatus
                  ? `${prettifyStatus(entry.previousStatus)} → ${prettifyStatus(entry.newStatus)}`
                  : null,
                // "Business name mismatch (78.00%) | Bank holder name
                // mismatch (22%)" → one bullet per reason instead of a
                // single run-on line.
                reasons: entry.reason
                  ? entry.reason.split("|").map((r) => r.trim()).filter(Boolean)
                  : [],
                date: entry.createdAt
                  ? new Date(entry.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                  : "—",
              };
            }),
          ];

          return (
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-4 mb-5">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
                Status History
              </p>

              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" />
                <div className="space-y-5">
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative flex items-start gap-3">
                      <span
                        className={`relative z-10 mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-4 ${item.dotColor} ${item.ringColor}`}
                      />
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {item.title ? (
                            <p className="text-sm font-medium text-gray-800">{item.title}</p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-medium text-gray-800">
                                {item.actionLabel}
                              </span>
                              {item.statusLabel && (
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${item.badgeClass}`}>
                                  {item.statusLabel}
                                </span>
                              )}
                              {item.attemptNumber && (
                                <span className="text-[11px] text-gray-400">
                                  · Attempt {item.attemptNumber}
                                </span>
                              )}
                              {item.performedByType && (
                                <span className="text-[11px] text-gray-400">
                                  · {prettifyStatus(item.performedByType)}
                                </span>
                              )}
                            </div>
                          )}

                          {item.transition && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.transition}</p>
                          )}

                          {item.reasons?.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {item.reasons.map((r, i) => (
                                <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mt-1.5" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  ))}

                  {verifyLoading && (
                    <div className="relative flex items-start gap-3">
                      <span className="relative z-10 mt-1 w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 ring-4 ring-amber-100" />
                      <p className="text-sm text-gray-500">Checking current status…</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Alert banner */}
        {isApproved ? (
          <div className="relative overflow-hidden rounded-2xl mb-5 bg-white border border-gray-100 shadow-sm px-6 py-10 sm:px-10">
            <style>{`
              @keyframes reviewBadgePop {
                0%   { transform: scale(0.5); opacity: 0; }
                60%  { transform: scale(1.08); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes reviewFadeUp {
                from { opacity: 0; transform: translateY(10px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes reviewRingPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.25); }
                50%      { box-shadow: 0 0 0 10px rgba(16,185,129,0.06); }
              }
              @keyframes reviewSunburst {
                0%, 100% { opacity: 0.4; transform: scale(0.92); }
                50%      { opacity: 1; transform: scale(1); }
              }
              @keyframes reviewTwinkle {
                0%, 100% { opacity: 0.25; transform: scale(0.85); }
                50%      { opacity: 1; transform: scale(1.1); }
              }
            `}</style>

            {/* Scattered sparkles/confetti — decorative, gently twinkling
                rather than falling, matching a "just landed, settled" feel. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {REVIEW_CONFETTI_ITEMS.map((item) =>
                item.isSparkle ? (
                  <Sparkle
                    key={item.id}
                    className="absolute text-emerald-400"
                    style={{
                      left: `${item.left}%`,
                      top: `${item.top}%`,
                      width: item.size,
                      height: item.size,
                      opacity: item.opacity,
                      animation: `reviewTwinkle ${item.duration}s ease-in-out ${item.delay}s infinite`,
                    }}
                    fill="currentColor"
                  />
                ) : (
                  <span
                    key={item.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${item.left}%`,
                      top: `${item.top}%`,
                      width: `${item.size}px`,
                      height: `${item.size * 0.55}px`,
                      background: item.color,
                      opacity: item.opacity,
                      transform: `rotate(${item.rotate}deg)`,
                      animation: `reviewTwinkle ${item.duration}s ease-in-out ${item.delay}s infinite`,
                    }}
                  />
                )
              )}
            </div>

            <div className="relative flex flex-col items-center text-center gap-3">
              <div className="relative flex items-center justify-center mb-1">
                {/* Sunburst rays behind the badge */}
                <div
                  className="absolute w-28 h-28"
                  style={{ animation: "reviewSunburst 2.4s ease-in-out infinite" }}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-emerald-300 rounded-full"
                      style={{
                        transform: `rotate(${i * 45}deg) translateY(-52px)`,
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </div>
                {/* Soft halo */}
                <div className="absolute w-24 h-24 rounded-full bg-emerald-100" />
                {/* Checkmark badge */}
                <div
                  className="relative w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"
                  style={{ animation: "reviewBadgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, reviewRingPulse 2.4s ease-in-out 0.5s infinite" }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
                style={{ animation: "reviewFadeUp 0.4s 0.15s ease both", opacity: 0 }}
              >
                <span className="text-gray-900">You're</span>{" "}
                <span className="text-emerald-600">approved!</span>{" "}
                <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
              </h2>
              <p
                className="text-sm sm:text-base text-gray-500 max-w-md"
                style={{ animation: "reviewFadeUp 0.4s 0.25s ease both", opacity: 0 }}
              >
                Your listing has been verified and is now live.
                <br />
                Head to your dashboard to start managing your outlet.
              </p>
            </div>

            <div
              className="relative mt-7 bg-white rounded-xl border border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ animation: "reviewFadeUp 0.4s 0.35s ease both", opacity: 0 }}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-16 flex items-center justify-center overflow-hidden rounded-md bg-gray-50 shrink-0">
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
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">{brandData.companyName}</p>
                  <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-emerald-500" /> {brandData.merchantToken}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> {formattedDate}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                <button
                  onClick={handleGoToDashboard}
                  disabled={acknowledging}
                  className="px-5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100
                    text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap
                    transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {acknowledging ? "Opening…" : "Go to Dashboard"}
                  {!acknowledging && <ArrowRight className="w-4 h-4" />}
                </button>
                {ackError && <p className="text-xs text-rose-500">{ackError}</p>}
              </div>
            </div>

            {/* Benefit strip */}
            <div
              className="relative mt-7 grid grid-cols-2 sm:grid-cols-4 gap-6"
              style={{ animation: "reviewFadeUp 0.4s 0.45s ease both", opacity: 0 }}
            >
              {[
                { icon: BadgeCheck, title: "Verified & Live", desc: "Your outlet is now visible to customers." },
                { icon: TrendingUp, title: "Boost Visibility", desc: "Increase reach and grow your business." },
                { icon: ShieldCheck, title: "Secure & Trusted", desc: "All details verified for a safe experience." },
                { icon: Headset, title: "Need Help?", desc: "Our support team is here for you." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Outlet card — approved case already shows this info inside the
            celebratory hero above, so this plain card is only for
            pending/rejected states. */}
        {!isApproved && (
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

              <button
                onClick={handleRecheck}
                disabled={refreshing}
                className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-lg bg-white
                  hover:bg-gray-50 text-gray-600 text-xs font-semibold
                  transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
              >
                {refreshing ? "Checking…" : "Recheck"}
              </button>
            </div>
          </div>
        )}

        {/* ── Rejected: Basic Details + Business Details correction
            panels, stacked vertically — Basic Details on top, Business
            Details below. Both are themselves collapsible (down-arrow
            header, same AccordionFieldCard as the inner PAN/GST/Bank
            rows), not just their individual fields. Not a new page —
            just input rows in cards, with the verified/saved result
            shown right below each one. ─────────────────────────────── */}
        {isRejected && (
          <div className="mt-5 space-y-4">
          <AccordionFieldCard title="Basic Details">
            <FieldCard title="Business Name">
              <PlainFieldRow
                value={businessNameField.value}
                onChange={businessNameField.setValue}
                placeholder="Registered business name"
                error={businessNameField.error}
                saved={businessNameField.saved}
              />
            </FieldCard>

            <FieldCard title="Brand Short Name">
              <PlainFieldRow
                value={brandShortNameField.value}
                onChange={brandShortNameField.setValue}
                placeholder="e.g. Trydood"
                error={brandShortNameField.error}
                saved={brandShortNameField.saved}
              />
            </FieldCard>

            <FieldCard title="Business Type">
              <PlainFieldRow error={businessTypeError} saved={businessTypeSaved}>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={`${inputBase} w-full`}
                >
                  {ENTITY_TYPE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </PlainFieldRow>
            </FieldCard>

            <div className="flex justify-end">
              <SaveButton onSave={handleSaveBasicDetails} saving={basicSaving} isDirty={basicDetailsDirty} />
            </div>
          </AccordionFieldCard>

          <AccordionFieldCard title="Business Details">
            <AccordionFieldCard
              title="PAN"
              summary={panField.result ? "✓ Verified" : panField.value || "Not set"}
              collapseSignal={panCollapse}
            >
              {panField.result ? (
                <VerifiedDetailCard
                  rows={[
                    { label: "PAN", value: panField.result.pan },
                    { label: "PAN Type", value: panField.result.panType?.toUpperCase()?.trim() },
                    { label: "Full Name", value: panField.result.fullName || panField.result.lastName },
                    { label: "DOB", value: panField.result.dob },
                  ]}
                  onChangeDetails={panField.reset}
                  onSave={handleSavePanDetails}
                  saving={panSubmit.submitting}
                  saveError={panSubmit.error}
                />
              ) : (
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
              )}
            </AccordionFieldCard>

            <AccordionFieldCard
              title="GST"
              summary={gstField.result ? "✓ Verified" : gstField.value || "Not set"}
              collapseSignal={gstCollapse}
            >
              {gstField.result ? (
                <VerifiedDetailCard
                  rows={[
                    { label: "GSTIN", value: gstField.result.gstNumber },
                    { label: "Legal Name", value: gstField.result.legalName },
                    { label: "Trade Name", value: gstField.result.tradeName },
                    { label: "Constitution of Business", value: gstField.result.constitutionOfBusiness },
                    { label: "Taxpayer Type", value: gstField.result.taxpayerType },
                    { label: "Registration Date", value: gstField.result.registrationDate },
                  ]}
                  onChangeDetails={gstField.reset}
                  onSave={handleSaveGstDetails}
                  saving={gstSubmit.submitting}
                  saveError={gstSubmit.error}
                />
              ) : (
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
              )}
            </AccordionFieldCard>

            <AccordionFieldCard
              title="Bank Account"
              summary={bankResult ? "✓ Verified" : bankFields.accountNumber || "Not set"}
              collapseSignal={bankCollapse}
            >
              {bankResult ? (
                <VerifiedDetailCard
                  rows={[
                    { label: "Account Number", value: bankFields.accountNumber },
                    { label: "Account Holder Name", value: bankResult.account_holder_name },
                    { label: "IFSC Code", value: bankResult.account_ifsc },
                    { label: "Bank Name", value: bankResult.bank_name },
                    { label: "Branch Name", value: bankResult.bank_branch },
                  ]}
                  onChangeDetails={resetBank}
                  onSave={handleSaveBankDetails}
                  saving={bankSubmit.submitting}
                  saveError={bankSubmit.error}
                />
              ) : (
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
                </div>
              )}
            </AccordionFieldCard>
          </AccordionFieldCard>

          {/* Only shows up once something has actually been saved — no
              point resubmitting for review if nothing changed. */}
          {hasUpdated && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submittingReview}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
                text-sm font-bold tracking-wide transition-all duration-150 active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingReview ? "Submitting…" : "Submit for Review"}
            </button>
          )}
          </div>
        )}

        {/* <button
          onClick={() => navigate("/manage-outlet")} // ← apna actual route lagana
          className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700
    text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
        >
          Manage Your Outlet
        </button> */}

        {/* ── Polling indicator — hidden once approved or rejected ── */}
        {isPending && (
          <p className="text-center text-xs text-gray-300 mt-8 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Checking review status…
          </p>
        )}
      </div>

      <ErrorToast error={verifyError} onDismiss={() => setVerifyError(null)} />
      <SuccessToast message={verifySuccessMsg} onDismiss={() => setVerifySuccessMsg("")} />
    </div>
  );
}
