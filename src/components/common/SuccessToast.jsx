import { useEffect } from "react";

export default function SuccessToast({ message, onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(110,231,183,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(110,231,183,0.15); }
        }
      `}</style>

      <div
        role="status"
        className="fixed top-2 right-2 z-[9999]
                   max-w-[350px] w-[calc(100vw-48px)]
                   bg-gradient-to-br from-emerald-700 via-emerald-800 to-[#06150f]
                   border border-emerald-400/25
                   rounded-2xl px-4 py-4.5
                   flex items-start gap-3
                   shadow-[0_8px_32px_-4px_rgba(16,185,129,0.35),0_4px_16px_rgba(0,0,0,0.45)]"
        style={{ animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full bg-emerald-300 shrink-0 mt-1"
          style={{ animation: "dotPulse 1.8s ease-in-out infinite" }}
        />

        <p className="flex-1 min-w-0 text-[13.5px] font-medium text-white m-0 leading-snug break-words">
          {message}
        </p>

        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="bg-transparent border-none cursor-pointer p-1 leading-none
                     text-emerald-100/60 rounded-full shrink-0
                     transition-colors hover:bg-white/10 hover:text-white"
        >
          <i className="ti ti-x text-[14px]" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}