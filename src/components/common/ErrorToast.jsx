import { useEffect } from "react";

// Distinguishes the "account deactivated" 403 case (a warning, amber) from
// every other error (a hard failure, rose) — same intent as before, just
// driving a dot color instead of icon/border colors.
function resolveVariant(status, message = "") {
  if (status === 403 && /inactive|deactivated/i.test(message)) {
    return { dot: "bg-amber-300", ring: "rgba(252,211,77,0.5)", ringSoft: "rgba(252,211,77,0.15)" };
  }
  return { dot: "bg-rose-300", ring: "rgba(252,165,165,0.5)", ringSoft: "rgba(252,165,165,0.15)" };
}

export default function ErrorToast({ error, onDismiss, duration = 5000 }) {
  const { status, message, txnId } = error || {};

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [error, duration, onDismiss]);

  if (!error) return null;

  const v = resolveVariant(status, message);

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotPulseError {
          0%, 100% { box-shadow: 0 0 0 0 ${v.ring}; }
          50% { box-shadow: 0 0 0 6px ${v.ringSoft}; }
        }
      `}</style>

      <div
        role="alert"
        className="fixed top-2 right-2 z-[9999]
                   max-w-[350px] w-[calc(100vw-48px)]
                   bg-gradient-to-br from-rose-700 via-red-800 to-[#1a0605]
                   border border-rose-400/25
                   rounded-2xl px-4 py-4.5
                   flex items-start gap-3
                   shadow-[0_8px_32px_-4px_rgba(220,38,38,0.35),0_4px_16px_rgba(0,0,0,0.45)]"
        style={{ animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${v.dot}`}
          style={{ animation: "dotPulseError 1.8s ease-in-out infinite" }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium text-white m-0 leading-snug break-words">
            {message}
          </p>
          {txnId && (
            <p className="text-[11px] text-rose-200/70 mt-1 font-mono">Ref: {txnId}</p>
          )}
        </div>

        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="bg-transparent border-none cursor-pointer p-1 leading-none
                     text-rose-100/60 rounded-full shrink-0
                     transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
