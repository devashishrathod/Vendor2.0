export default function SummaryRow({ label, value, muted, accent, sub }) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${muted ? "text-gray-500" : "text-gray-700"}`}>
          {label}
        </span>
        <span
          className={`text-sm font-semibold ${
            muted ? "text-gray-500" : accent ? "text-teal-600" : "text-gray-800"
          }`}
        >
          {value}
        </span>
      </div>
      {sub && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{sub.label}</span>
          <button
            onClick={sub.onRemove}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
