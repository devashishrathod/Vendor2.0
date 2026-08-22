import StatusBadge from "./StatusBadge";
import { OUTLET_TYPE_LABELS } from "../constants/outletConstants";
import { formatJoinedDate, maskStoreId } from "../utils/outletUtils";

// ⚠️ FIXED: outlet.outletName / outlet.registrationType haven't existed on
// the outlet record since the Add Outlet form dropped them (name & address
// now come from the picked Location, and "registration type" became
// outletType) — this was still reading the old field names and rendering
// blank. Now reads the mapped `outlet` shape useOutlets/useOutletDetails
// both produce, plus `brand` for the outlet's display name.
export default function OutletDetailsHeader({ outlet, brand, onBack }) {
  const displayName = brand?.brandName || brand?.legalBusinessName || "Outlet";
  const isVerified = brand?.isApproved;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold text-gray-900">{displayName}</p>
            {isVerified && (
              <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.3l2.2 1.1 2.4-.5 1.3 2.1 2.1 1.3-.5 2.4L20.7 11l-1.2 2.3.5 2.4-2.1 1.3-1.3 2.1-2.4-.5L12 19.9l-2.2-1.1-2.4.5-1.3-2.1-2.1-1.3.5-2.4L3.3 11l1.2-2.3-.5-2.4 2.1-1.3L7.4 2.9l2.4.5L12 2.3z" />
                <path d="M9.5 12.1l1.8 1.8 3.3-3.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Store Id : {maskStoreId(outlet.storeId)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2">
          Joined {formatJoinedDate(outlet.joinedDate)}
        </span>
        <span className="text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2">
          {OUTLET_TYPE_LABELS[outlet.outletType] || "—"}
        </span>
        <StatusBadge status={outlet.status} />
      </div>
    </div>
  );
}
