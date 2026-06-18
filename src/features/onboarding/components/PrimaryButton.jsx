export default function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200
        flex items-center justify-center gap-2
        ${
          disabled || loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-sm shadow-indigo-200"
        } ${className}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
