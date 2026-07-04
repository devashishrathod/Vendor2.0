import {
  useOnboardingStore,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { useState } from "react";
import { BASE_URL } from "../../../config";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorModal from "@/components/common/ErrorModal";
import ConfirmModal from "@/components/common/ConfirmModal";

// ── Extract a 6-digit standalone pincode from a free-form address string.
function extractPincode(address) {
  if (!address) return null;
  const matches = address.match(/\b\d{6}\b/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

function IconBadge({ bgColor, children }) {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: bgColor }}
    >
      {children}
    </div>
  );
}

function DetailRow({ icon, iconBg, label, value, mono = false, last }) {
  if (!value || value === "—" || value === "null" || value === null)
    return null;

  // ── If value is an object (bank_address), render as formatted string ──
  const displayValue =
    typeof value === "object"
      ? [value.addressLine1, value.city, value.district, value.state, value.pinCode, value.country]
          .filter(Boolean)
          .join(", ")
      : value;

  return (
    <div
      className={`flex items-center justify-between py-2.5 ${
        last ? "" : "border-b border-gray-100"
      } last:border-0`}
    >
      <div className="flex items-center gap-2">
        <IconBadge bgColor={iconBg}>{icon}</IconBadge>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span
        className={`text-xs font-semibold text-gray-800 text-right max-w-[55%] ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}

// ── Navigation delay — must match SuccessToast duration ──
const NAV_DELAY = 1500;

export default function Step12BankReadOnly({ accountType }) {
  const { goToStep, setSubStep } = useOnboardingStore();
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const bankDetails = useOnboardingStore((state) => state.formData.bankDetails);

  const raw = bankDetails ?? {};

  // ── result is now single source of truth (merged in Step11) ──
  const result = raw.result ?? {};

  const enteredAccountNumber =
    raw.enteredAccountNumber || result.account_number || "—";

  // ── Safe address display: result.bank_address is object (from Step11 merge),
  //    fallback to raw ifsc string parts if somehow still old format ──
  const bankAddressDisplay = (() => {
    if (result.bank_address && typeof result.bank_address === "object") {
      return [
        result.bank_address.addressLine1,
        // result.bank_address.city,
        // result.bank_address.district,
        // result.bank_address.state,
        // result.bank_address.pinCode,
      ]
        .filter(Boolean)
        .join(", ") || null;
    }
    if (typeof result.bank_address === "string") return result.bank_address;
    // fallback — old store shape
    return [raw.ifscBankAddress, raw.ifscCity, raw.ifscState]
      .filter(Boolean)
      .join(", ") || null;
  })();

  const d = {
    status: raw.status || "—",
    message: raw.message || "—",
    accountNumber: enteredAccountNumber,
    accountHolderName: result.account_holder_name || "—",
    ifscCode: result.account_ifsc || "—",
    isValid: result.is_valid === true,
    paymentMode: result.payment_mode || null,
    recommendedAction: result.recommended_action || null,
    failureReason: result.failure_reason || null,
    isNameMatch: result.is_name_match,
    matchingScore:
      result.matching_score !== null && result.matching_score !== undefined
        ? `${result.matching_score}%`
        : null,
    accountType: accountType || raw.accountType || result.account_type || null,
    // ── All three now come directly from merged result ──
    bank_name:    result.bank_name    || raw.ifscBankName   || null,
    bank_branch:  result.bank_branch  || raw.ifscBranchName || null,
    bank_address: bankAddressDisplay,
  };

  const nameMatchValue =
    d.isNameMatch === true
      ? "Matched"
      : d.isNameMatch === false
        ? "Not Matched"
        : null;

  const handleContinue = async () => {
    setPosting(true);
    setPostError(null);
    try {
      const token = localStorage.getItem("token");

      // ── Build verifyResponse from raw store data ──
      const verifyResponse = {
        success: raw.success ?? true,
        status: raw.status || "SUCCESS",
        message: raw.message || "Bank verified successfully",
        result: raw.result ?? {},
        tranx_id: raw.tranx_id || null,
        requestId: raw.requestId || null,
        timestamp: raw.timestamp || new Date().toISOString(),
        chargeble: raw.chargeble ?? true,
        user_consent: raw.user_consent ?? true,
      };

      // ── result is already merged with Razorpay data from Step11 ──
      const verifyResult = verifyResponse.result ?? {};

      // ── Build bankAddress payload object cleanly from merged result ──
      const bankAddressPayload = (() => {
        if (verifyResult.bank_address && typeof verifyResult.bank_address === "object") {
          // Already structured object from Step11 merge — use directly
          return {
            addressLine1: verifyResult.bank_address.addressLine1 || undefined,
            city:         verifyResult.bank_address.city         || undefined,
            district:     verifyResult.bank_address.district     || undefined,
            state:        verifyResult.bank_address.state        || undefined,
            pinCode:      verifyResult.bank_address.pinCode      || undefined,
            country:      verifyResult.bank_address.country      || "India",
          };
        }
        if (typeof verifyResult.bank_address === "string") {
          // Edge case: string address
          return {
            addressLine1: verifyResult.bank_address,
            pinCode: extractPincode(verifyResult.bank_address) || undefined,
          };
        }
        // Fallback: raw Razorpay fields (safe-net, usually not needed after Step11 merge)
        if (raw.ifscBankAddress) {
          return {
            addressLine1: raw.ifscBankAddress,
            city:         raw.ifscCity     || undefined,
            district:     raw.ifscDistrict || undefined,
            state:        raw.ifscState    || undefined,
            pinCode:      extractPincode(raw.ifscBankAddress) || undefined,
            country:      "India",
          };
        }
        return undefined;
      })();

      const payload = {
        // ── Core bank fields ──
        isValid:          verifyResult.is_valid,
        recommendedAction: verifyResult.recommended_action,
        accountHolderName: verifyResult.account_holder_name,
        accountNumber:     enteredAccountNumber,
        ifscCode:          verifyResult.account_ifsc,

        // ── Verification meta ──
        isVerified:              verifyResponse.success ?? true,
        verificationStatus:      verifyResponse.status || "SUCCESS",
        verificationMessage:     verifyResponse.message || "Bank verified successfully",
        providerTransactionId:   verifyResponse.tranx_id   || undefined,
        providerRequestId:       verifyResponse.requestId  || undefined,
        verifiedAt:              verifyResponse.timestamp,
        verificationResponse:    verifyResponse,
        verificationProvider:    "CGPEY",
        currentScreen:           "SYSTEM_VERIFICATION",

        // ── Account type (from store, set in Step11) ──
        accountType: accountType || raw.accountType || undefined,

        // ── Bank info — all from merged result (single source of truth) ──
        bankName:   verifyResult.bank_name   || raw.ifscBankName   || undefined,
        branchName: verifyResult.bank_branch || raw.ifscBranchName || undefined,
        bankAddress: bankAddressPayload,

        // ── MICR — from merged result.micr_code, fallback raw ifscMicr ──
        micrCode: verifyResult.micr_code || raw.ifscMicr || undefined,

        // ── Name match & score ──
        isNameMatch:   verifyResult.is_name_match ?? undefined,
        matchingScore:
          verifyResult.matching_score != null
            ? String(verifyResult.matching_score)
            : undefined,

        // ── Payment & failure info ──
        paymentMode:              verifyResult.payment_mode    || undefined,
        failureReason:            verifyResult.failure_reason  || undefined,
        npciErrorCode:            verifyResult.npci_error_code || undefined,
        retrievalReferenceNumber: verifyResult.rrn             || undefined,
        user:                     verifyResult.user            || undefined,

        // ── Consent & billing ──
        chargeable:  raw.chargeble === "true"     || raw.chargeble === true,
        userConsent: raw.user_consent === "true"  || raw.user_consent === true,
      };

      console.log("Step12 — payload being sent:", JSON.stringify(payload, null, 2));

      const res = await fetch(`${BASE_URL}/brands/onboarding/add-bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (
          res.status === 400 &&
          err?.message?.toLowerCase().includes("already exists")
        ) {
          goToStep(STEPS.PARTNER_CONTRACT);
          return;
        }
        if (res.status === 409) {
          goToStep(STEPS.PARTNER_CONTRACT);
          return;
        }
        throw new Error(err?.message || `Server error ${res.status}`);
      }

      setSuccessMsg(`Bank account ${d.accountNumber} verified successfully`);
      setTimeout(() => {
        goToStep(STEPS.SYSTEM_VERIFY);
      }, NAV_DELAY);
    } catch (err) {
      setPostError({
        humanMessage:
          err.message || "Failed to save bank details. Please try again.",
        txnId: null,
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <SuccessToast
        message={successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={NAV_DELAY}
      />

      <ErrorModal
        error={postError}
        onDismiss={() => setPostError(null)}
        onRetry={() => {
          setPostError(null);
          handleContinue();
        }}
      />

      <div
        className="w-full max-w-xl mx-auto"
        style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity:0; transform:translateY(14px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              Bank Account Verified
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review your details carefully before continuing
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold flex-shrink-0">
            <svg className="w-3.5 h-3.5 fill-emerald-500" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.08L6.7 12.2l1.41-1.42 2.48 2.49 5.31-5.32 1.41 1.42-6.72 6.71z" />
            </svg>
            Verified
          </div>
        </div>

        <div className="relative bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between overflow-hidden">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <svg className="w-20 h-20 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">
              Account Number
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="font-mono text-lg font-bold tracking-[0.14em] text-emerald-900">
                {d.accountNumber}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm mb-4">
          <DetailRow
            label="Account Holder Name"
            value={d.accountHolderName}
            iconBg="#EFF6FF"
            icon={
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <DetailRow
            label="IFSC Code"
            value={d.ifscCode}
            mono
            iconBg="#FAF5FF"
            icon={
              <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <DetailRow
            label="Account Type"
            value={d.accountType}
            iconBg="#ECFEFF"
            icon={
              <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <DetailRow
            label="Bank Name"
            value={d.bank_name}
            iconBg="#EEF2FF"
            icon={
              <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9h.01M9 13h.01M9 17h.01" />
              </svg>
            }
          />

          <DetailRow
            label="Branch Name"
            value={d.bank_branch}
            iconBg="#FFFBEB"
            icon={
              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M3 21h2m6-14h2m-2 4h2m-2 4h2" />
              </svg>
            }
          />

          <DetailRow
            label="Bank Address"
            value={d.bank_address}
            iconBg="#ECFDF5"
            icon={
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />

          <DetailRow
            label="Recommended Action"
            value={d.recommendedAction}
            iconBg="#FFF7ED"
            icon={
              <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <DetailRow
            label="Name Match"
            value={nameMatchValue}
            iconBg="#FFF1F2"
            icon={
              <svg className="w-3.5 h-3.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <DetailRow
            label="Matching Score"
            value={d.matchingScore}
            last
            iconBg="#F0FDFA"
            icon={
              <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm6 0V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2zm6 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            }
          />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed flex-1">
            Please verify these details carefully. Incorrect bank details may
            cause issues during payment processing.
          </p>
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={posting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white
              hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold
              transition-all duration-200 active:scale-[0.98] flex items-center justify-center
              gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Change Details
          </button>

          <button
            onClick={handleContinue}
            disabled={posting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
              text-sm font-semibold transition-all duration-200 active:scale-[0.98]
              shadow-sm shadow-emerald-200 flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {posting ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Change bank details?"
          description="Are you sure you want to go back and change your bank account? Your current verified information will be cleared."
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            setSubStep(BANK_SUB.BANK_VERIFICATION);
          }}
        />
      )}
    </>
  );
}