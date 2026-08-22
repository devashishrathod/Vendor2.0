import { ANALYTICS_REPORTS } from "../constants/outletConstants";

export default function AnalyticsMenu({ onClose }) {
  return (
    <div className="absolute z-20 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2">
      {ANALYTICS_REPORTS.map((report) => (
        <button
          key={report}
          onClick={onClose}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {report}
        </button>
      ))}
    </div>
  );
}
