import { useEffect, useState } from "react";

/**
 * Bridges the gap between "payment done" and the Welcome modal showing up,
 * and gives failed payments somewhere to land instead of nothing happening.
 *
 * status: 'processing' | 'success' | 'failed'
 * onSuccessDone: called once the success animation has finished playing —
 *                this is where you flip to the WelcomePage modal.
 * onRetry:  called when the person taps "Try Again" on the failure screen.
 * onCancel: called when the person taps "Cancel" / closes the failure screen.
 * errorMessage: shown on the failure screen.
 */
export default function PaymentStatusOverlay({
  status,
  onSuccessDone,
  onRetry,
  onCancel,
  errorMessage,
}) {
  // Small flower petals drifting down during the "processing" state —
  // soft and slow, not a party-confetti burst, since we don't know yet
  // whether this ends in success or failure.
  const [petals] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 10,
      duration: Math.random() * 3 + 4.5,
      delay: Math.random() * 4,
      drift: Math.random() * 50 - 25,
      hue: [ "#f9a8d4", "#fbcfe8", "#fde68a", "#bbf7d0", "#c7d2fe" ][i % 5],
    }))
  );

  // Hold the success screen just long enough to register, then hand off.
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => onSuccessDone?.(), 1500);
    return () => clearTimeout(t);
  }, [status, onSuccessDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <style>{`
        @keyframes petal-fall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(420px) translateX(var(--drift)) rotate(300deg); opacity: 0; }
        }
        @keyframes ring-spin { to { transform: rotate(360deg); } }
        @keyframes circle-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes error-pop {
          0%   { transform: scale(0.6) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-10 overflow-hidden text-center">
        {/* ---------- PROCESSING ---------- */}
        {status === "processing" && (
          <>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {petals.map((p) => (
                <span
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    left: `${p.left}%`,
                    top: "-10px",
                    width: `${p.size}px`,
                    height: `${p.size * 0.7}px`,
                    background: p.hue,
                    "--drift": `${p.drift}px`,
                    animation: `petal-fall ${p.duration}s ease-in ${p.delay}s infinite`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-6 w-16 h-16 relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-teal-100"
                  style={{ borderTopColor: "#09B285", animation: "ring-spin 0.9s linear infinite" }}
                />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Verifying your payment…</h2>
              <p className="text-sm text-gray-500">This usually takes just a few seconds. Please don't close this window.</p>
            </div>
          </>
        )}

        {/* ---------- SUCCESS ---------- */}
        {status === "success" && (
          <div className="relative z-10" style={{ animation: "circle-pop 0.5s ease-out" }}>
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" stroke="#09B285" strokeWidth="2.5" opacity="0.25" />
                <path
                  d="M13 23l6 6 12-14"
                  stroke="#09B285"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="34"
                  strokeDashoffset="34"
                  style={{ animation: "check-draw 0.5s ease-out 0.15s forwards" }}
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Successful!</h2>
            <p className="text-sm text-gray-500">Setting up your welcome page…</p>
          </div>
        )}

        {/* ---------- FAILED ---------- */}
        {status === "failed" && (
          <div className="relative z-10" style={{ animation: "error-pop 0.4s ease-out, error-shake 0.5s ease-out 0.4s" }}>
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2.5" opacity="0.25" />
                <path d="M14 14l12 12M26 14L14 26" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Failed</h2>
            <p className="text-sm text-gray-500 mb-6">
              {errorMessage || "Your payment couldn't be completed. No amount has been deducted, or it will be refunded automatically."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-xl text-white font-semibold transition-colors"
                style={{ background: "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)" }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}