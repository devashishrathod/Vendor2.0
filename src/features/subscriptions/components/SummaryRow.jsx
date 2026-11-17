export default function SummaryRow({ label, value, muted, accent, strike, sub }) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${muted ? "text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
          {label}
        </span>
        <span
          className={`text-sm font-semibold ${strike ? "line-through" : ""} ${
            muted ? "text-gray-500" : accent ? "text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-gray-100"
          }`}
        >
          {value}
        </span>
      </div>
      {sub && (
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">{sub.label}</span>
          <button
            onClick={sub.onRemove}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
