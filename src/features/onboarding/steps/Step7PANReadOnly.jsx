import {
  useOnboardingStore,
  BIZ_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { useState } from "react";
import { BASE_URL } from "../../../config";
import SuccessToast from "@/components/common/SuccessToast";
import ErrorModal from "@/components/common/ErrorModal";
import ConfirmModal from "@/components/common/ConfirmModal";

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

function DetailRow({ icon, iconBg, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <IconBadge bgColor={iconBg}>{icon}</IconBadge>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">
        {value}
      </span>
    </div>
  );
}

export default function Step7PANReadOnly() {
  const { setSubStep } = useOnboardingStore();
  const panDetails = useOnboardingStore((state) => state.formData.panDetails);
  const brandId = useOnboardingStore((state) => state.formData.brandId);

  const [showConfirm, setShowConfirm] = useState(false);

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(true);

  const raw = panDetails?.data ?? panDetails ?? {};
  const addr = raw.addressDetails || {};

  const addrParts = [
    addr.building_name,
    addr.street_name,
    addr.locality,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ].filter((v) => v && v.trim() !== "");
  const addrString = addrParts.length > 0 ? addrParts.join(", ") : null;

  const convertDobToISO = (dob) => {
    if (!dob) return null;
    if (dob.includes("T")) return dob;
    const [day, month, year] = dob.split("/");
    if (!day || !month || !year) return null;
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    ).toISOString();
  };

  const d = {
    pan: raw.pan || "—",
    panType: raw.panType?.toUpperCase()?.trim(),
    fullName: raw.fullName || raw.lastName,
    dob: raw.dob || "—",
    status: raw.status || "—",
    message: raw.message || "—",
    address: addrString,
  };

  const isSuccess = ["Active", "SUCCESS"].includes(d.status);

  const handleContinue = async () => {
    if (!brandId) {
      setPostError({
        humanMessage: "Brand ID not found. Please restart onboarding.",
        txnId: null,
      });
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const token = localStorage.getItem("token");
      const verifyData = panDetails?.data ?? panDetails ?? {};

      const verifyResponse = panDetails?.requestId
        ? panDetails
        : {
            success: verifyData.success ?? true,
            message: verifyData.message || "PAN verification completed",
            data: verifyData,
            requestId: verifyData.clientRefNum || null,
            timestamp: verifyData.timestamp || new Date().toISOString(),
            statusCode: 200,
            status: verifyData.status || "SUCCESS",
          };

      const payload = {
        brandId,
        pan: verifyData.pan || d.pan,
        panType: verifyData.panType?.toUpperCase()?.trim() || d.panType,
        fullName: verifyData.fullName || d.fullName,
        isVerified: verifyData.success ?? true,
        verificationStatus: verifyData.status || "SUCCESS",
        verificationMessage: verifyData.message || "Pan verified successfully",
        providerTransactionId:
          verifyData.transactionId || verifyData.providerTransactionId,
        providerRequestId: verifyData.clientRefNum,
        verifiedAt: verifyData.timestamp || new Date().toISOString(),
        verificationResponse: verifyResponse,
        firstName: verifyData.firstName || undefined,
        middleName: verifyData.middleName || undefined,
        lastName: verifyData.lastName || undefined,
        dob: convertDobToISO(verifyData.dob) || undefined,
        gender: verifyData.gender || undefined,
        aadhaarNumber: verifyData.aadhaarNumber || undefined,
        isAadhaarLinked: verifyData.aadhaarLinked ?? undefined,
        addressDetails:
          verifyData.addressDetails &&
          Object.values(verifyData.addressDetails).some(
            (v) => v && v.trim() !== "",
          )
            ? {
                buildingName:
                  verifyData.addressDetails.building_name || undefined,
                locality: verifyData.addressDetails.locality || undefined,
                streetName: verifyData.addressDetails.street_name || undefined,
                pincode: verifyData.addressDetails.pincode || undefined,
                city: verifyData.addressDetails.city || undefined,
                state: verifyData.addressDetails.state || undefined,
                country: verifyData.addressDetails.country || undefined,
              }
            : undefined,
        verificationProvider: "CGPEY",
        currentScreen: "GST_VERIFICATION",
      };

      const res = await fetch(`${BASE_URL}/brands/onboarding/add-pan-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err?.message?.toLowerCase() || "";
        if (
          res.status === 400 &&
          (errMsg.includes("already exists") ||
            errMsg.includes("already in use"))
        ) {
          setSubStep(BIZ_SUB.GST_VERIFICATION);
          return;
        }
        throw new Error(err?.message || `Server error ${res.status}`);
      }

      setSubStep(BIZ_SUB.GST_VERIFICATION);
    } catch (err) {
      setPostError({
        humanMessage:
          err.message || "Failed to save PAN details. Please try again.",
        txnId: null,
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* ── Success Toast ── */}
      <SuccessToast
        message={
          successMsg && isSuccess
            ? `PAN ${d.pan} verified successfully`
            : null
        }
        onDismiss={() => setSuccessMsg(false)}
        duration={3500}
      />

      {/* ── Error Modal ── */}
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

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5 ">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              PAN Verified
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review your details carefully before continuing
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold flex-shrink-0">
            {/* circle-check icon */}
            <svg className="w-3.5 h-3.5 fill-emerald-500" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.08L6.7 12.2l1.41-1.42 2.48 2.49 5.31-5.32 1.41 1.42-6.72 6.71z" />
            </svg>
            Verified
          </div>
        </div>

        {/* ── PAN Card ── */}
        <div className="relative bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between overflow-hidden">
          {/* watermark */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <svg className="w-20 h-20 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">
              PAN Number
            </p>
            <div className="flex items-center gap-2.5">
              {/* id-badge icon */}
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                </svg>
              </div>
              <span className="font-mono text-xl font-bold tracking-[0.14em] text-emerald-900">
                {d.pan}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* ── Detail Card ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm mb-4">
          {/* Full Name */}
          {d.fullName && d.fullName !== "—" && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Full Name</span>
              </div>
              <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">{d.fullName}</span>
            </div>
          )}

          {/* PAN Type */}
          {d.panType && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">PAN Type</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{d.panType}</span>
            </div>
          )}

          {/* Registration Date */}
          {d.dob && d.dob !== "—" && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-50">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Date of Incorporation</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{d.dob}</span>
            </div>
          )}

          {/* Address */}
          {d.address && (
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Address</span>
              </div>
              <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">{d.address}</span>
            </div>
          )}
        </div>

        {/* ── Warning Notice ── */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed flex-1">
            Please verify these details carefully. Incorrect PAN details may
            cause issues during payment processing.
          </p>
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            // onClick={() => setSubStep(BIZ_SUB.PAN_VERIFICATION)}
            onClick={() => setShowConfirm(true)}
            disabled={posting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white
              hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold
              transition-all duration-200 active:scale-[0.98] flex items-center justify-center
              gap-2 disabled:opacity-50"
          >
            {/* pencil icon */}
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
    title="Change PAN details?"
    description="Are you sure you want to go back and change your PAN? Your current verified information will be cleared."
    onCancel={() => setShowConfirm(false)}
    onConfirm={() => { setShowConfirm(false); setSubStep(BIZ_SUB.PAN_VERIFICATION); }}
  />
)}

    </>
  );
}