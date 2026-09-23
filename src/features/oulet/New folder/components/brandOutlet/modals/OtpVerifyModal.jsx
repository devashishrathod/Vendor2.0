export default function OtpVerifyModal({
  phone,
  otpValue,
  onOtpChange,
  otpError,
  onConfirm,
  onClose,
  onResend,
  resending,
  confirming,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Verify WhatsApp Number</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3 3-3-3z" />
            </svg>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            We've sent a 6-digit OTP over WhatsApp to{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{phone}</span>. Enter it below to verify this number.
          </p>

          <input
            type="text"
            autoFocus
            value={otpValue}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!confirming) onConfirm();
              }
            }}
            disabled={confirming}
            placeholder="Enter OTP"
            className="w-full rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-semibold outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-800 dark:text-gray-100 disabled:opacity-60"
          />

          {otpError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{otpError}</p>}

          <button
            onClick={onResend}
            disabled={resending || confirming}
            className="text-xs font-semibold text-emerald-600 hover:underline mt-3 disabled:opacity-50 disabled:no-underline"
          >
            {resending ? "Resending…" : "Didn't get it? Resend OTP"}
          </button>
        </div>

        <div className="px-6 py-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={otpValue.length < 4 || confirming}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              otpValue.length >= 4 && !confirming
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {confirming && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {confirming ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
