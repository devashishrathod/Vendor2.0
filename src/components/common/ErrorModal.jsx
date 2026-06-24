import { useEffect } from "react";

export default function ErrorModal({ error, onDismiss, onRetry, duration = 10000 }) {
  const { humanMessage, txnId } = error || {};

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [error, duration, onDismiss]);

  if (!error) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.15); }
        }
      `}</style>

      <div
        role="alert"
        className="fixed top-6 right-6 z-[9999]
                   max-w-[380px] w-[calc(100vw-48px)]
                   bg-white border border-red-100
                   rounded-2xl px-4 py-3.5
                   flex items-start gap-3
                   shadow-[0_8px_32px_-4px_rgba(239,68,68,0.18),0_4px_16px_rgba(0,0,0,0.08)]"
        style={{ animation: "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-red-800 m-0">
            Verification failed
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5 leading-snug break-words">
            {humanMessage || "Something went wrong. Please try again."}
          </p>

          {txnId && (
            <p className="text-[10.5px] text-gray-400 font-mono mt-1.5 break-all">
              ID: {txnId}
            </p>
          )}

          {onRetry && (
            <button
              onClick={() => {
                onDismiss();
                onRetry();
              }}
              className="mt-2 text-[12px] font-semibold text-red-600 hover:text-red-700
                         flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="bg-transparent border-none cursor-pointer p-1 leading-none
                     text-gray-400 rounded-full shrink-0
                     transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}