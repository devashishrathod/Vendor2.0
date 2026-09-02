import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Foreground push-notification toast — distinct from SuccessToast/ErrorToast
 * (bell icon, indigo theme, click-to-open when the payload carries a
 * deepLink) so it reads as "something happened elsewhere", not a form
 * success/error state.
 */
export default function PushNotificationToast({ toast, onDismiss, duration = 6000 }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  const handleClick = () => {
    if (toast.deepLink) navigate(toast.deepLink);
    onDismiss();
  };

  return (
    <>
      <style>{`
        @keyframes pushToastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(129,140,248,0.15); }
        }
      `}</style>

      <div
        role="alert"
        onClick={toast.deepLink ? handleClick : undefined}
        className={`fixed top-2 right-2 z-[9999]
                   max-w-[360px] w-[calc(100vw-48px)]
                   bg-gradient-to-br from-indigo-700 via-indigo-800 to-[#0b0a1f]
                   border border-indigo-400/25
                   rounded-2xl px-4 py-4
                   flex items-start gap-3
                   shadow-[0_8px_32px_-4px_rgba(79,70,229,0.35),0_4px_16px_rgba(0,0,0,0.45)]
                   ${toast.deepLink ? "cursor-pointer" : ""}`}
        style={{ animation: "pushToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <span
          className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"
          style={{ animation: "bellPulse 1.8s ease-in-out infinite" }}
        >
          <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-white m-0 leading-snug break-words">
            {toast.title}
          </p>
          {toast.body && (
            <p className="text-[12.5px] text-indigo-100/80 mt-1 leading-snug break-words">
              {toast.body}
            </p>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
          className="bg-transparent border-none cursor-pointer p-1 leading-none
                     text-indigo-100/60 rounded-full shrink-0
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
