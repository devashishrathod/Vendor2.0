import { FILTER_OPTIONS } from "../constants/outletConstants";

export default function FilterPanel({ filters, onToggleFilter, onClear, onClose }) {
  const statusOptions = FILTER_OPTIONS.filter((f) => f.group === "status");
  const typeOptions = FILTER_OPTIONS.filter((f) => f.group === "type");

  return (
    <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</p>
        <div className="space-y-2">
          {statusOptions.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.status.includes(opt.value)}
                onChange={() => onToggleFilter("status", opt.value)}
                className="w-4 h-4 accent-indigo-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Registered With</p>
        <div className="space-y-2">
          {typeOptions.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.type.includes(opt.value)}
                onChange={() => onToggleFilter("type", opt.value)}
                className="w-4 h-4 accent-indigo-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button onClick={onClear} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
          Clear all
        </button>
        <button onClick={onClose} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          Done
        </button>
      </div>
    </div>
  );
}
