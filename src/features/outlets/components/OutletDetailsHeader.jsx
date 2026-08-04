import StatusBadge from "./StatusBadge";
import { REGISTRATION_TYPE_LABELS } from "../constants/outletConstants";
import { formatJoinedDate, maskStoreId } from "../utils/outletUtils";

export default function OutletDetailsHeader({ outlet, onBack }) {
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

        <div className="w-10 h-10 rounded-xl bg-[#3d1a4a] flex items-center justify-center text-white shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c4.97 0 9-3.582 9-8s-4.03-8-9-8-9 3.582-9 8a7.5 7.5 0 003 6L4 21l5-1.36A9.3 9.3 0 0012 21z" />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold text-gray-900">{outlet.outletName}</p>
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.3l2.2 1.1 2.4-.5 1.3 2.1 2.1 1.3-.5 2.4L20.7 11l-1.2 2.3.5 2.4-2.1 1.3-1.3 2.1-2.4-.5L12 19.9l-2.2-1.1-2.4.5-1.3-2.1-2.1-1.3.5-2.4L3.3 11l1.2-2.3-.5-2.4 2.1-1.3L7.4 2.9l2.4.5L12 2.3z" />
              <path d="M9.5 12.1l1.8 1.8 3.3-3.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Store Id : {maskStoreId(outlet.storeId)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2">
          Joined {formatJoinedDate(outlet.joinedDate)}
        </span>
        <span className="text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2">
          {REGISTRATION_TYPE_LABELS[outlet.registrationType]}
        </span>
        <StatusBadge status={outlet.status} />
      </div>
    </div>
  );
}
