import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import { STEPS } from "@/features/onboarding/constants/steps";
import { systemVerify } from "@/features/onboarding/services/api/verify.api";
import { parseApiError } from "@/hooks/useApiError";
import ErrorModal from "@/components/common/ErrorModal";
import ErrorToast from "@/components/common/ErrorToast";

// ── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({ label, status, detail }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
      <div
        className={`w-4.5 h-4.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
        ${
          status === "done"
            ? "bg-emerald-500"
            : status === "failed"
              ? "bg-red-400"
              : status === "warn"
                ? "bg-amber-400"
                : status === "checking"
                  ? "bg-emerald-100"
                  : "bg-gray-100"
        }`}
      >
        {status === "done" && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === "failed" && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {status === "warn" && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        )}
        {status === "checking" && (
          <svg className="w-2.5 h-2.5 text-emerald-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={`text-xs font-medium transition-colors duration-300
          ${
            status === "done"
              ? "text-emerald-700"
              : status === "failed"
                ? "text-red-500"
                : status === "warn"
                  ? "text-amber-600"
                  : status === "checking"
                    ? "text-gray-700"
                    : "text-gray-400"
          }`}
        >
          {label}
        </span>
        {detail && (
          <p className={`text-[10px] mt-0.5 leading-snug
            ${status === "failed" ? "text-red-400" : status === "warn" ? "text-amber-500" : "text-gray-400"}`}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-gray-800">{score}</span>
        </div>
      </div>
      <span className="text-[9px] text-gray-400 mt-0.5">Score</span>
    </div>
  );
}

// ── Gear icon ─────────────────────────────────────────────────────────────────
function GearIcon() {
  return (
    <svg className="w-8 h-8 text-emerald-500 animate-spin" style={{ animationDuration: "2s" }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ── Build check rows from API flags ──────────────────────────────────────────
function buildChecks(flags = {}, remarks = []) {
  const remark = (key) => remarks.find((r) => r.toLowerCase().includes(key)) || null;

  return [
    {
      key: "pan",
      label: "PAN Verified",
      status: flags.panVerified ? "done" : "failed",
      detail: !flags.panVerified ? "PAN could not be verified" : null,
    },
    {
      key: "gst",
      label: "GST Verified & Active",
      status: !flags.gstVerified ? "failed" : !flags.gstActive ? "warn" : "done",
      detail: !flags.gstVerified
        ? "GST could not be verified"
        : !flags.gstActive
          ? "GST is inactive"
          : null,
    },
    {
      key: "panGst",
      label: "PAN ↔ GST Match",
      status: flags.panMatchedWithGST ? "done" : "warn",
      detail: !flags.panMatchedWithGST ? remark("pan") || "PAN and GST name mismatch" : null,
    },
    {
      key: "bank",
      label: "Bank Account Verified",
      status: !flags.bankVerified ? "failed" : !flags.bankMatched ? "warn" : "done",
      detail: !flags.bankVerified
        ? "Bank could not be verified"
        : !flags.bankMatched
          ? remark("bank") || "Bank holder name mismatch"
          : null,
    },
    {
      key: "entity",
      label: "Business Entity Match",
      status: flags.businessEntityMatched ? "done" : "warn",
      detail: !flags.businessEntityMatched ? "Entity type mismatch between PAN and GST" : null,
    },
    {
      key: "duplicate",
      label: "No Duplicate Records",
      status:
        flags.duplicatePAN || flags.duplicateGST || flags.duplicateBank || flags.duplicateWhatsapp
          ? "warn"
          : "done",
      detail: flags.duplicateWhatsapp
        ? remark("duplicate") || "Duplicate merchant details detected"
        : null,
    },
  ];
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step10SystemVerify({ onSuccess }) {
  const {
    goToStep,
    setVerificationFailedChecks,
  } = useOnboardingStore();

  const [phase, setPhase] = useState("loading");
  const [checks, setChecks] = useState([]);
  const [sysData, setSysData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const animateChecks = async (builtChecks) => {
    const pending = builtChecks.map((c) => ({ ...c, status: "pending" }));
    setChecks(pending);

    for (let i = 0; i < builtChecks.length; i++) {
      setChecks((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, status: "checking" } : c)),
      );
      await new Promise((r) => setTimeout(r, 500 + i * 80));
      setChecks((prev) =>
        prev.map((c, idx) => (idx === i ? builtChecks[i] : c)),
      );
    }
    await new Promise((r) => setTimeout(r, 200));
  };

  const runVerification = async () => {
    setPhase("loading");
    setChecks([]);
    setApiError(null);
    setShowModal(false);
    setSysData(null);

    try {
      const res = await systemVerify();
      const data = res.data;
      setSysData(data);

      const builtChecks = buildChecks(data.flags, data.remarks);
      await animateChecks(builtChecks);

      const problemChecks = builtChecks
        .filter((c) => c.status === "failed" || c.status === "warn")
        .map((c) => c.key);
      setVerificationFailedChecks(problemChecks);

      const s = data.status;
      if (s === "APPROVED") {
        setPhase("success");
        setVerificationFailedChecks([]);
      } else if (s === "REVIEW" || s === "MANUAL_REVIEW") {
        setPhase("review");
      } else {
        setPhase("failed");
      }
    } catch (err) {
      const parsed = parseApiError(err.responseData || { message: err.message });
      setApiError(parsed);
      setShowModal(true);
      setPhase("error");
    }
  };

  useEffect(() => {
    runVerification();
  }, []); // eslint-disable-line

  const handleRetry = async () => {
    setRetrying(true);
    await new Promise((r) => setTimeout(r, 200));
    setRetrying(false);
    runVerification();
  };

  const handleContinue = () => {
    if (onSuccess) onSuccess();
    else goToStep(STEPS.PARTNER_CONTRACT);
  };

  const phaseConfig = {
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
      cardBg: "bg-emerald-50",
      cardBorder: "border-emerald-100",
      title: "Verification Passed",
      subtitle: "All checks completed successfully.",
    },
    review: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      cardBg: "bg-amber-50",
      cardBorder: "border-amber-100",
      title: "Under Review",
      subtitle: "Some items need manual review. You can continue.",
    },
    failed: {
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      cardBg: "bg-red-50",
      cardBorder: "border-red-100",
      title: "Verification Failed",
      subtitle: "Some details could not be verified. Please retry.",
    },
    error: {
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      cardBg: "bg-red-50",
      cardBorder: "border-red-100",
      title: "Connection Error",
      subtitle: "Failed to reach the verification server.",
    },
  };

  const cfg = phaseConfig[phase];

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-sm" style={{ animation: "stepIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both" }}>
        <style>{`
          @keyframes stepIn { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes popIn  { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
        `}</style>

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100
              flex items-center justify-center mx-auto mb-4 shadow-sm">
              <GearIcon />
            </div>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">System Verification</h2>
              <p className="text-xs text-gray-400">Cross-checking your PAN, GST & Bank details…</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
              {checks.length === 0 ? (
                <div className="flex items-center gap-3 py-3">
                  <svg className="w-3.5 h-3.5 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-xs text-gray-400">Contacting verification server…</span>
                </div>
              ) : (
                checks.map((c) => (
                  <CheckRow key={c.key} label={c.label} status={c.status} detail={c.detail} />
                ))
              )}
            </div>
          </>
        )}

        {/* ── RESULT ── */}
        {phase !== "loading" && cfg && (
          <>
            {/* Icon + score row */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div
                className={`w-12 h-12 rounded-full ${cfg.iconBg} flex items-center justify-center`}
                style={{ animation: "popIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both" }}
              >
                {phase === "success" && (
                  <svg className={`w-6 h-6 ${cfg.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {phase === "review" && (
                  <svg className={`w-6 h-6 ${cfg.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {(phase === "failed" || phase === "error") && (
                  <svg className={`w-6 h-6 ${cfg.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              {sysData?.score != null && <ScoreRing score={sysData.score} />}
            </div>

            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">{cfg.title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">{cfg.subtitle}</p>
            </div>

            {/* Checks card — compact */}
            {checks.length > 0 && (
              <div className={`${cfg.cardBg} border ${cfg.cardBorder} rounded-2xl px-4 py-1 mb-4`}>
                {checks.map((c) => (
                  <CheckRow key={c.key} label={c.label} status={c.status} detail={c.detail} />
                ))}
              </div>
            )}

            {/* Remarks — only if present, compact */}
            {sysData?.remarks?.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Remarks</p>
                {sysData.remarks.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-0.5 last:mb-0">
                    <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                    <span className="text-[10px] text-amber-700 leading-snug">{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {(phase === "success" || phase === "review") && (
              <button
                onClick={handleContinue}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white
                  text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98]
                  shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
              >
                Continue to Partner Contract
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Failed / Error — only retry, no edit navigation */}
            {(phase === "failed" || phase === "error") && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white
                  text-sm font-bold transition-all duration-200 active:scale-[0.98]
                  shadow-sm shadow-red-100 flex items-center justify-center gap-2
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {retrying ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {retrying ? "Retrying…" : "Try Again"}
              </button>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-300 mt-4">Step 10 of 13</p>
      </div>

      {/* Error Modal */}
      <ErrorModal
        error={showModal ? apiError : null}
        onDismiss={() => { setShowModal(false); setApiError(null); }}
        onRetry={() => { setShowModal(false); setApiError(null); handleRetry(); }}
      />

      {/* Error Toast */}
      <ErrorToast
        error={!showModal && apiError ? apiError : null}
        onDismiss={() => setApiError(null)}
      />
    </div>
  );
}