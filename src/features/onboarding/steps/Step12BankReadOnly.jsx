


import { useOnboardingStore, BANK_SUB } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { useState, useEffect } from "react";

function DetailRow({ label, value, mono = false }) {
  if (!value || value === '—' || value === null) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0 max-w-[45%]">{label}</span>
      <span className={`text-xs font-semibold text-gray-800 text-right ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </span>
    </div>
  );
}

/* ── Centre-top toast — bank verification ── */
function VerificationToast({ status, accountType, paymentMode, message, isSuccess }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
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
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border relative overflow-hidden bg-white
          ${isSuccess ? 'border-emerald-100 shadow-emerald-100/60' : 'border-red-100 shadow-red-100/60'}`}
        style={{ minWidth: 300, maxWidth: 400 }}
      >
        {/* Icon */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isSuccess
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />}
          </svg>
        </div>

        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {/* Status */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
            ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {status}
          </span>

          {/* Account Type */}
          {accountType && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                bg-blue-50 text-blue-700">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {accountType}
              </span>
            </>
          )}

          {/* Payment Mode */}
          {paymentMode && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                bg-purple-50 text-purple-700">
                {paymentMode}
              </span>
            </>
          )}

          {/* Message */}
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-[10px] text-gray-400 font-medium">{message}</span>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ animation: 'shrink 3.6s linear 0.4s forwards', transformOrigin: 'left' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Step12BankReadOnly({ accountType }) {
  const { goToStep, setSubStep } = useOnboardingStore();
  const [posting,   setPosting]   = useState(false);
  const [postError, setPostError] = useState(null);

  const bankDetails = useOnboardingStore(state => state.formData.bankDetails);

  const raw    = bankDetails ?? {};
  const result = raw.result ?? {};

  const enteredAccountNumber = raw.enteredAccountNumber || result.account_number || '—';

  const d = {
    status:            raw.status                    || '—',
    message:           raw.message                   || '—',
    accountNumber:     enteredAccountNumber,
    accountHolderName: result.account_holder_name    || '—',
    ifscCode:          result.account_ifsc           || '—',
    isValid:           result.is_valid === true,
    paymentMode:       result.payment_mode           || null,
    recommendedAction: result.recommended_action     || null,
    failureReason:     result.failure_reason         || null,
    isNameMatch:       result.is_name_match,
    matchingScore:     result.matching_score !== null && result.matching_score !== undefined
                         ? `${result.matching_score}%` : null,
    accountType:       accountType || result.account_type || null,
    bank_name:         result.bank_name              || null,
    bank_branch:       result.bank_branch            || null,
    bank_address:      result.bank_address           || null,
  };

  const isSuccess = ['SUCCESS', 'success'].includes(d.status) && d.isValid;

  const handleContinue = async () => {
    setPosting(true);
    setPostError(null);
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const token   = localStorage.getItem('token');

      const verifyResponse = raw.requestId
        ? raw
        : {
            success:      raw.success      ?? true,
            status:       raw.status       || 'SUCCESS',
            message:      raw.message      || 'Bank verified successfully',
            result:       raw.result       ?? {},
            tranx_id:     raw.tranx_id     || null,
            requestId:    raw.requestId    || null,
            timestamp:    raw.timestamp    || new Date().toISOString(),
            chargeble:    raw.chargeble    ?? true,
            user_consent: raw.user_consent ?? true,
          };

      const verifyResult = verifyResponse.result ?? {};

      const payload = {
        isValid:                verifyResult.is_valid,
        recommendedAction:      verifyResult.recommended_action,
        accountHolderName:      verifyResult.account_holder_name,
        accountNumber:          enteredAccountNumber,
        ifscCode:               verifyResult.account_ifsc,
        isVerified:             verifyResponse.success              ?? true,
        verificationStatus:     verifyResponse.status               || 'SUCCESS',
        verificationMessage:    verifyResponse.message              || 'Bank verified successfully',
        providerTransactionId:  verifyResponse.tranx_id,
        providerRequestId:      verifyResponse.requestId,
        verifiedAt:             verifyResponse.timestamp,
        verificationResponse:   verifyResponse,
        accountType:            accountType                         || undefined,
        bankName:               verifyResult.bank_name              || undefined,
        branchName:             verifyResult.bank_branch            || undefined,
        bankAddress:            verifyResult.bank_address
                                  ? {
                                      addressLine1: verifyResult.bank_address.addressLine1 || undefined,
                                      city:         verifyResult.bank_address.city         || undefined,
                                      district:     verifyResult.bank_address.district     || undefined,
                                      state:        verifyResult.bank_address.state        || undefined,
                                      pinCode:      verifyResult.bank_address.pinCode      || undefined,
                                      country:      verifyResult.bank_address.country      || undefined,
                                    }
                                  : undefined,
        isNameMatch:            verifyResult.is_name_match          ?? undefined,
        matchingScore:          verifyResult.matching_score != null
                                  ? String(verifyResult.matching_score)
                                  : undefined,
        paymentMmode:           verifyResult.payment_mode           || undefined,
        failureReason:          verifyResult.failure_reason         || undefined,
        npciErrorCode:          verifyResult.npci_error_code        || undefined,
        retrievalReferenceNumber: verifyResult.rrn                  || undefined,
        user:                   verifyResult.user                   || undefined,
        chargeable:             raw.chargeble === 'true'            || raw.chargeble === true,
        userConsent:            raw.user_consent === 'true'         || raw.user_consent === true,
        verificationProvider:   'CGPEY',
        currentScreen:          'SYSTEM_VERIFICATION',
      };

      console.log('Step12 — Final payload:', payload);

      const res = await fetch(`${baseUrl}brands/onboarding/add-bank-details`, {
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
          goToStep(STEPS.PARTNER_CONTRACT);
          return;
        }
        if (res.status === 409) {
          goToStep(STEPS.PARTNER_CONTRACT);
          return;
        }
        throw new Error(err?.message || `Server error ${res.status}`);
      }

      goToStep(STEPS.PARTNER_CONTRACT);
    } catch (err) {
      setPostError(err.message || 'Failed to save bank details. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Toast — fixed top-center, auto-dismisses in 4s */}
      <VerificationToast
        status={d.status}
        accountType={d.accountType}
        paymentMode={d.paymentMode}
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
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Bank Account Verified</h2>
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

        {/* Account hero card */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl px-5 py-4 mb-4
          flex items-center justify-between shadow-md shadow-emerald-100">
          <div>
            <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-widest mb-1">
              Account Number
            </p>
            <p className="text-white text-lg font-mono font-bold tracking-[0.15em]">
              {d.accountNumber}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>

        {/* Detail card — full width */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm mb-4">
          <DetailRow label="Account Holder Name" value={d.accountHolderName} />
          <DetailRow label="IFSC Code"           value={d.ifscCode} mono />
          <DetailRow label="Account Type"        value={d.accountType} />
          <DetailRow label="Recommended Action"  value={d.recommendedAction} />
          <DetailRow label="Name Match"          value={
            d.isNameMatch === true  ? 'Matched' :
            d.isNameMatch === false ? 'Not Matched' : null
          } />
          <DetailRow label="Matching Score"  value={d.matchingScore} />
          <DetailRow label="Bank Name"       value={d.bank_name} />
          <DetailRow label="Branch Name"     value={d.bank_branch} />
          <DetailRow label="Bank Address"    value={d.bank_address} />
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3
          flex items-start gap-2.5 mb-4">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please verify these details carefully. Incorrect bank details may cause issues during payment processing.
          </p>
        </div>

        {/* POST error */}
        {postError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-red-600 font-medium">{postError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setSubStep(BANK_SUB.BANK_VERIFICATION)}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
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
