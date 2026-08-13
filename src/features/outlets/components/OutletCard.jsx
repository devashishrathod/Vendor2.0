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

export default function OutletCard({ outlet, selected, onSelect, onToggleStatus, onExploreDetails }) {
  // outletName / outletAddress no longer exist on the outlet record, and
  // aren't shown on this card — see note below on why.
  const whatsapp = outlet.whatsapp || {};

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
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 mt-2">
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