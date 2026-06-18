import {
  useOnboardingStore,
  BIZ_SUB,
  BANK_SUB,
} from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { useState, useEffect } from "react";
import { BASE_URL } from "../../../config";

function DetailRow({ label, value }) {
  if (!value || value === "—" || value === "null" || value === null)
    return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0 max-w-[45%]">
        {label}
      </span>
      <span className="text-xs font-semibold text-gray-800 text-right">
        {value}
      </span>
    </div>
  );
}

/* ── Centre-top toast — same pattern as PAN ── */
function VerificationToast({
  registrationStatus,
  taxpayerType,
  message,
  isActive,
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 400);
    const hide = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setVisible(false), 350);
    }, 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        animation: leaving
          ? "toastOut 0.35s cubic-bezier(0.4,0,1,1) forwards"
          : "toastIn 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards",
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-16px) scale(0.95); }
          to   { opacity:1; transform:translateX(-50%) translateY(0)     scale(1);    }
        }
        @keyframes toastOut {
          from { opacity:1; transform:translateX(-50%) translateY(0)     scale(1);    }
          to   { opacity:0; transform:translateX(-50%) translateY(-12px) scale(0.96); }
        }
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border relative overflow-hidden
          ${
            isActive
              ? "bg-white border-blue-100 shadow-blue-100/60"
              : "bg-white border-red-100 shadow-red-100/60"
          }`}
        style={{ minWidth: 290, maxWidth: 380 }}
      >
        {/* Left icon */}
        <div
          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          ${isActive ? "bg-blue-500" : "bg-red-500"}`}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isActive ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            )}
          </svg>
        </div>

        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
          >
            {registrationStatus}
          </span>

          <span className="w-1 h-1 rounded-full bg-gray-300" />

          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            bg-blue-50 text-blue-700"
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
              />
            </svg>
            {taxpayerType}
          </span>

          <span className="w-1 h-1 rounded-full bg-gray-300" />

          <span className="text-[10px] text-gray-400 font-medium">
            {message}
          </span>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${isActive ? "bg-blue-400" : "bg-red-400"}`}
            style={{
              animation: "shrink 3.6s linear 0.4s forwards",
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Step9GSTReadOnly() {
  const { setSubStep, goToStep } = useOnboardingStore();
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const gstDetails = useOnboardingStore((state) => state.formData.gstDetails);

  console.log("Step9 — gstDetails from store:", gstDetails);

  const raw = gstDetails ?? {};

  console.log("Step9 — raw gstDetails:", raw);

  const d = {
    status: raw.status || "—",
    message: raw.message || "—",
    gstNumber: raw.gstNumber || "—",
    legalName: raw.legalName || "—",
    tradeName: raw.tradeName || "—",
    constitutionOfBusiness: raw.constitutionOfBusiness || "—",
    taxpayerType: raw.taxpayerType || "—",
    registrationDate: raw.registrationDate || "—",
    cancellationDate: raw.cancellationDate || null,
    registrationStatus: raw.registrationStatus || "—",
    natureOfBusiness:
      Array.isArray(raw.natureOfBusiness) && raw.natureOfBusiness.length > 0
        ? raw.natureOfBusiness.join(", ")
        : null,
    address: (() => {
      const a = raw.address;
      if (!a) return null;
      const parts = [
        a.building_number,
        a.building_name,
        a.location,
        a.city,
        a.district,
        a.state,
        a.pin,
      ].filter((v) => v && v.trim() !== "" && v !== "NA");
      return a.location && a.location.trim() !== ""
        ? a.location
        : parts.join(", ") || null;
    })(),
  };

  console.log("Step9 — final d:", d);

  const isActive =
    ["Active", "SUCCESS"].includes(d.registrationStatus) ||
    ["Active", "SUCCESS"].includes(d.status);

  const convertToISO = (dateStr) => {
    if (!dateStr || dateStr === "NA") return undefined;
    if (dateStr.includes("T")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(
        Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])),
      ).toISOString();
    }
    return dateStr;
  };

  const normalizeTaxpayerType = (val) => {
    if (!val) return undefined;
    const upper = val.toUpperCase().trim().replace(/\s+/g, "_");
    const map = {
      REGULAR: "REGULAR",
      COMPOSITION: "COMPOSITION",
      SEZ_UNIT: "SEZ_UNIT",
      SEZ_DEVELOPER: "SEZ_DEVELOPER",
      INPUT_SERVICE_DISTRIBUTOR: "INPUT_SERVICE_DISTRIBUTOR",
      ISD: "INPUT_SERVICE_DISTRIBUTOR",
      TAX_DEDUCTOR: "TAX_DEDUCTOR",
      TAX_COLLECTOR: "TAX_COLLECTOR",
      CASUAL_TAXABLE_PERSON: "CASUAL_TAXABLE_PERSON",
      NON_RESIDENT_TAXABLE_PERSON: "NON_RESIDENT_TAXABLE_PERSON",
      GOVERNMENT_DEPARTMENT: "GOVERNMENT_DEPARTMENT",
      UN_BODY: "UN_BODY",
      EMBASSY: "EMBASSY",
      OIDAR: "OIDAR",
      REGISTERED_PERSON: "REGISTERED_PERSON",
    };
    return map[upper] || "REGULAR";
  };

  const normalizeRegStatus = (val) => {
    if (!val) return undefined;
    const upper = val.toUpperCase().trim();
    if (upper === "ACTIVE") return "SUCCESS";
    return upper;
  };

  const handleContinue = async () => {
    setPosting(true);
    setPostError(null);
    try {
      const token = localStorage.getItem("token");
      const verifyData = gstDetails?.data ?? gstDetails ?? {};

      const verifyResponse = gstDetails?.requestId
        ? gstDetails
        : {
            success: verifyData.success ?? true,
            message: verifyData.message || "GST verification completed",
            data: verifyData,
            requestId: verifyData.clientRefNum || null,
            timestamp: verifyData.timestamp || new Date().toISOString(),
            statusCode: 200,
            status: verifyData.status || "SUCCESS",
          };

      console.log("Step9 — verifyResponse to be sent:", verifyResponse);

      const payload = {
        gstNumber: verifyData.gstNumber,
        legalName: verifyData.legalName,
        constitutionOfBusiness: verifyData.constitutionOfBusiness,
        taxpayerType: normalizeTaxpayerType(verifyData.taxpayerType),
        registrationDate: convertToISO(verifyData.registrationDate),
        registrationStatus: normalizeRegStatus(verifyData.registrationStatus),
        isVerified: verifyData.success ?? true,
        verificationStatus: verifyData.status || "SUCCESS",
        verificationMessage: verifyData.message || "GST verified successfully",
        providerTransactionId:
          verifyData.transactionId || verifyData.providerTransactionId,
        providerRequestId: verifyData.clientRefNum,
        verifiedAt: verifyData.timestamp || new Date().toISOString(),
        verificationResponse: verifyResponse,
        tradeName: verifyData.tradeName || undefined,
        cancellationDate: verifyData.cancellationDate || undefined,
        filingStatus: verifyData.filingStatus || undefined,
        stateCode: verifyData.stateCode || undefined,
        centerCode: verifyData.centerCode || undefined,
        natureOfBusiness:
          Array.isArray(verifyData.natureOfBusiness) &&
          verifyData.natureOfBusiness.length > 0
            ? verifyData.natureOfBusiness
            : undefined,
        stateJurisdiction: verifyData.stateJurisdiction || undefined,
        stateJurisdictionCode: verifyData.stateJurisdictionCode || undefined,
        lastUpdated: convertToISO(verifyData.lastUpdated),
        address:
          verifyData.address &&
          Object.values(verifyData.address).some(
            (v) => v && String(v).trim() !== "",
          )
            ? {
                floorNumber: verifyData.address.floor_number || undefined,
                buildingNumber: verifyData.address.building_number || undefined,
                buildingName: verifyData.address.building_name || undefined,
                location: verifyData.address.location || undefined,
                city: verifyData.address.city || undefined,
                district: verifyData.address.district || undefined,
                state: verifyData.address.state || undefined,
                pin: verifyData.address.pin || undefined,
                country: "India",
                latitude: verifyData.address.latitude || undefined,
                longitude: verifyData.address.longitude || undefined,
                businessNature: verifyData.address.business_nature || undefined,
              }
            : undefined,
        chargeable: verifyData.chargeable ?? true,
        userConsent: verifyData.userConsent ?? true,
        verificationProvider: "CGPEY",
        currentScreen: "BANK_VERIFICATION",
      };

      console.log("Step9 — Final payload:", payload);

      const res = await fetch(`${BASE_URL}/brands/onboarding/add-gst-details`, {
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
          goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.BANK_VERIFICATION);
          return;
        }
        throw new Error(err?.message || `Server error ${res.status}`);
      }

      goToStep(STEPS.BANK_VERIFICATION, BANK_SUB.BANK_VERIFICATION);
    } catch (err) {
      setPostError(
        err.message || "Failed to save GST details. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Toast — fixed top-center, auto-dismisses */}
      <VerificationToast
        registrationStatus={d.registrationStatus}
        taxpayerType={d.taxpayerType}
        message={d.message}
        isActive={isActive}
      />

      <div
        className="w-full"
        style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}
      >
        <style>{`
          @keyframes stepIn {
            from { opacity:0; transform:translateY(14px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              GST Verified
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review your details carefully before continuing
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
            bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold"
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
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Verified
          </div>
        </div>

        {/* GSTIN Card */}
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-5 py-4 mb-4
          flex items-center justify-between shadow-md shadow-blue-100"
        >
          <div>
            <p className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest mb-1">
              GSTIN
            </p>
            <p className="text-white text-lg font-mono font-bold tracking-[0.15em]">
              {d.gstNumber}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Detail card — full width */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm mb-4">
          <DetailRow label="Legal Name" value={d.legalName} />
          <DetailRow label="Trade Name" value={d.tradeName} />
          <DetailRow
            label="Constitution of Business"
            value={d.constitutionOfBusiness}
          />
          <DetailRow label="Taxpayer Type" value={d.taxpayerType} />
          <DetailRow label="Registration Date" value={d.registrationDate} />
          {d.cancellationDate && (
            <DetailRow label="Cancellation Date" value={d.cancellationDate} />
          )}
          {d.natureOfBusiness && (
            <DetailRow label="Nature of Business" value={d.natureOfBusiness} />
          )}
          {d.address && <DetailRow label="Address" value={d.address} />}
        </div>

        {/* Warning notice */}
        <div
          className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3
          flex items-start gap-2.5 mb-4"
        >
          <svg
            className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
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
          <p className="text-xs text-amber-700 leading-relaxed">
            Please verify these details carefully. Incorrect GST details may
            cause issues during onboarding & tax processing.
          </p>
        </div>

        {/* Error */}
        {postError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
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
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-red-600 font-medium">{postError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setSubStep(BIZ_SUB.GST_VERIFICATION)}
            disabled={posting}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300
              hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all duration-200
              active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
