import { useOnboardingStore, BIZ_SUB } from "@/features/onboarding/store/onboardingStore";
import { useState, useEffect } from "react";

function DetailRow({ label, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

/* ── Centre-top toast that auto-dismisses ── */
function VerificationToast({ status, panType, message, isSuccess }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slight delay so page animation finishes first
    const show = setTimeout(() => setVisible(true), 400);
    const hide = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setVisible(false), 350);
    }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: leaving
          ? 'toastOut 0.35s cubic-bezier(0.4,0,1,1) forwards'
          : 'toastIn 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards',
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
      `}</style>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border
        ${isSuccess
          ? 'bg-white border-emerald-100 shadow-emerald-100/60'
          : 'bg-white border-red-100 shadow-red-100/60'}`}
        style={{ minWidth: 280, maxWidth: 360 }}
      >
        {/* Left icon circle */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isSuccess
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
          </svg>
        </div>

        {/* Pills row */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {/* Status */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {status}
          </span>

          {/* Divider dot */}
          <span className="w-1 h-1 rounded-full bg-gray-300" />

          {/* PAN Type */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            bg-blue-50 text-blue-700">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
            {panType}
          </span>

          {/* Divider dot */}
          <span className="w-1 h-1 rounded-full bg-gray-300" />

          {/* Message */}
          <span className="text-[10px] text-gray-400 font-medium">{message}</span>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ animation: 'shrink 3.6s linear 0.4s forwards', transformOrigin: 'left' }}
          />
        </div>
        <style>{`
          @keyframes shrink {
            from { transform: scaleX(1); }
            to   { transform: scaleX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function Step7PANReadOnly() {
  const { setSubStep } = useOnboardingStore();
  const panDetails = useOnboardingStore(state => state.formData.panDetails);
  const brandId = useOnboardingStore(state => state.formData.brandId);

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const raw = panDetails?.data ?? panDetails ?? {};
  const addr = raw.addressDetails || {};

  const addrParts = [
    addr.building_name, addr.street_name, addr.locality,
    addr.city, addr.state, addr.pincode, addr.country,
  ].filter(v => v && v.trim() !== '');
  const addrString = addrParts.length > 0 ? addrParts.join(', ') : null;

  const convertDobToISO = (dob) => {
    if (!dob) return null;
    if (dob.includes('T')) return dob;
    const [day, month, year] = dob.split("/");
    if (!day || !month || !year) return null;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
  };

  const d = {
    pan: raw.pan || '—',
    panType: raw.panType?.toUpperCase()?.trim() || '—',
    fullName: raw.fullName || raw.lastName || '—',
    dob: raw.dob || '—',
    status: raw.status || '—',
    message: raw.message || '—',
    address: addrString,
  };

  const isSuccess = ['Active', 'SUCCESS'].includes(d.status);

  const handleContinue = async () => {
    if (!brandId) {
      setPostError('Brand ID not found. Please restart onboarding.');
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const token = localStorage.getItem('token');
      const verifyData = panDetails?.data ?? panDetails ?? {};

      const verifyResponse = panDetails?.requestId
        ? panDetails
        : {
          success: verifyData.success ?? true,
          message: verifyData.message || 'PAN verification completed',
          data: verifyData,
          requestId: verifyData.clientRefNum || null,
          timestamp: verifyData.timestamp || new Date().toISOString(),
          statusCode: 200,
          status: verifyData.status || 'SUCCESS',
        };

      const payload = {
        brandId,
        pan: verifyData.pan || d.pan,
        panType: verifyData.panType?.toUpperCase()?.trim() || d.panType,
        fullName: verifyData.fullName || d.fullName,
        isVerified: verifyData.success ?? true,
        verificationStatus: verifyData.status || 'SUCCESS',
        verificationMessage: verifyData.message || 'Pan verified successfully',
        providerTransactionId: verifyData.transactionId || verifyData.providerTransactionId,
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
        addressDetails: verifyData.addressDetails &&
          Object.values(verifyData.addressDetails).some(v => v && v.trim() !== '')
          ? {
            buildingName: verifyData.addressDetails.building_name || undefined,
            locality: verifyData.addressDetails.locality || undefined,
            streetName: verifyData.addressDetails.street_name || undefined,
            pincode: verifyData.addressDetails.pincode || undefined,
            city: verifyData.addressDetails.city || undefined,
            state: verifyData.addressDetails.state || undefined,
            country: verifyData.addressDetails.country || undefined,
          }
          : undefined,
        verificationProvider: 'CGPEY',
        currentScreen: 'GST_VERIFICATION',
      };

      const res = await fetch(`${baseUrl}brands/onboarding/add-pan-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 400 && err?.message?.toLowerCase().includes('already exists')) {
          setSubStep(BIZ_SUB.GST_VERIFICATION);
          return;
        }
        throw new Error(err?.message || `Server error ${res.status}`);
      }

      setSubStep(BIZ_SUB.GST_VERIFICATION);
    } catch (err) {
      setPostError(err.message || 'Failed to save PAN details. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Toast — renders outside the card flow, fixed at top-center */}
      <VerificationToast
        status={d.status}
        panType={d.panType}
        message={d.message}
        isSuccess={isSuccess}
      />

      <div className="w-full" style={{ animation: 'stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}>
        <style>{`
          @keyframes stepIn {
            from { opacity:0; transform:translateY(14px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">PAN Verified</h2>
            <p className="text-xs text-gray-400 mt-0.5">Review your details carefully before continuing</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
            bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </div>
        </div>

        {/* PAN Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl px-5 py-4 mb-4
          flex items-center justify-between shadow-md shadow-emerald-100">
          <div>
            <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-widest mb-1">PAN Number</p>
            <p className="text-white text-xl font-mono font-bold tracking-[0.2em]">{d.pan}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Detail card — full width, clean */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm mb-4">
          <DetailRow label="Full Name" value={d.fullName} />
          <DetailRow label="PAN Type" value={d.panType} />
          <DetailRow label="Registration Date" value={d.dob} />
          <DetailRow label="Address" value={d.address} />
        </div>

        {/* Warning notice */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3
          flex items-start gap-2.5 mb-4">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please verify these details carefully. Incorrect PAN details may cause issues during payment processing.
          </p>
        </div>

        {/* Error */}
        {postError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-600 font-medium">{postError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setSubStep(BIZ_SUB.PAN_VERIFICATION)}
            disabled={posting}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 bg-white
              hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold
              transition-all duration-200 active:scale-[0.98] flex items-center justify-center
              gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
    </>
  );
}