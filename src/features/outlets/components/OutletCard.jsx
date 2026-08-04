import StatusBadge from "./StatusBadge";
import ActiveToggle from "./ActiveToggle";
import { REGISTRATION_TYPE_LABELS } from "../constants/outletConstants";
import { formatJoinedDate, maskStoreId } from "../utils/outletUtils";

export default function OutletCard({ outlet, selected, onSelect, onToggleStatus, onExploreDetails }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(outlet.id)}
            className="w-4 h-4 accent-indigo-600 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-800">Store Id : {maskStoreId(outlet.storeId)}</span>
        </div>
        <StatusBadge status={outlet.status} />
      </div>

      <div className="px-5 py-4 flex-1 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-900">Outlet Name</p>
          <p className="text-sm text-gray-600 mt-0.5">{outlet.outletName}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Outlet Address</p>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{outlet.outletAddress}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            Outlet Register With ({REGISTRATION_TYPE_LABELS[outlet.registrationType]})
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{outlet.registeredWith}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
          Joined {formatJoinedDate(outlet.joinedDate)}
        </span>
        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
          {REGISTRATION_TYPE_LABELS[outlet.registrationType]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
        <ActiveToggle status={outlet.status} onToggle={() => onToggleStatus(outlet.id)} />
        <button
          onClick={() => onExploreDetails(outlet)}
          className="px-5 py-2 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d5e] transition-colors"
        >
          Explore Details
        </button>
      </div>
    </div>
  );
}
