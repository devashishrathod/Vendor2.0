export default function ErrorModal({ error, onDismiss, onRetry }) {
  const { humanMessage, txnId } = error || {};
  if (!error) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: "fadeInModal 0.15s ease" }}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes slideUpModal {
          from { opacity:0; transform:translateY(20px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="bg-white rounded-2xl border border-red-100 w-full max-w-sm overflow-hidden"
        style={{
          animation: "slideUpModal 0.25s cubic-bezier(0.34,1.4,0.64,1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* ── Header ── */}
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">
              Verification failed
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              We couldn't verify your details
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg
              className="w-3.5 h-3.5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Error message box */}
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
            <svg
              className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-red-700 leading-relaxed font-medium">
              {humanMessage || "Something went wrong. Please try again."}
            </p>
          </div>

          {/* Transaction ID */}
          {txnId && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Transaction ID
              </p>
              <p className="text-xs text-gray-600 font-mono break-all leading-relaxed">
                {txnId}
              </p>
            </div>
          )}

          {/* Help text */}
          <div className="flex items-start gap-2 px-1">
            <svg
              className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
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
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Double-check your details and try again. If the issue persists,
              contact support.
            </p>
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50
              text-gray-600 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
          >
            Dismiss
          </button>
          {onRetry && (
            <button
              onClick={() => {
                onDismiss();
                onRetry();
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white
                text-sm font-semibold transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2 shadow-sm shadow-red-100"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
      </div>
    </div>
  );
}
