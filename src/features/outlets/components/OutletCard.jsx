import StatusBadge from "./StatusBadge";
import ActiveToggle from "./ActiveToggle";
import { OUTLET_TYPE_LABELS } from "../constants/outletConstants";
import { formatJoinedDate, maskStoreId } from "../utils/outletUtils";

// A single "Label   Value" row — used for every field in the card body so
// they all line up consistently instead of each field getting its own
// heading + paragraph.
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right break-words">{value}</span>
    </div>
  );
}

export default function OutletCard({ outlet, selected, onSelect, onToggleStatus, onExploreDetails, onEdit }) {
  // outletName no longer exists on the outlet record. `address`, however,
  // IS available whenever the outlet has a saved location (see
  // mapSubBrandToOutlet) — shown below when present.
  const whatsapp = outlet.whatsapp || {};

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(outlet.id)}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">Store Id : {maskStoreId(outlet.storeId)}</span>
          </div>
        </div>
        <StatusBadge status={outlet.status} />
      </div>

      <div className="px-5 py-1 flex-1">
        <InfoRow
          label="WhatsApp"
          value={
            <span className="inline-flex items-center gap-1.5 justify-end">
              {whatsapp.number || "—"}
              {whatsapp.verified && (
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          }
        />
        <InfoRow label="Outlet Type" value={OUTLET_TYPE_LABELS[outlet.outletType] || "—"} />
        <InfoRow label="Joined" value={formatJoinedDate(outlet.joinedDate)} />
        {outlet.address && <InfoRow label="Address" value={outlet.address} />}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 mt-2">
        <ActiveToggle status={outlet.status} onToggle={() => onToggleStatus(outlet.id)} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(outlet)}
            title="Edit outlet"
            aria-label="Edit outlet"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onExploreDetails(outlet)}
            className="px-5 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Explore Details
          </button>
        </div>
      </div>
    </div>
  );
}