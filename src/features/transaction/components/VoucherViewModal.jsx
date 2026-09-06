import useVoucherDetails from "@/features/voucher/hooks/voucher/useVoucherDetails";
import VoucherDetailsInfo from "@/features/voucher/components/voucher/Voucherdetailsinfo";

// "View Page" (VOUCHER INFORMATION section, OrderDetail.jsx) opens this
// instead of navigating away — reuses the same hook + info component the
// standalone /vouchers/:voucherId page already uses, so every field here is
// the same confirmed-real data, just shown in a modal over the transaction.
export default function VoucherViewModal({ voucherId, onClose }) {
  const { voucher, isLoading, error } = useVoucherDetails(voucherId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-bold text-gray-900">Voucher Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-16">Loading voucher details…</p>
        )}

        {!isLoading && error && (
          <p className="text-sm text-red-500 text-center py-16">{error}</p>
        )}

        {!isLoading && !error && !voucher && (
          <p className="text-sm text-gray-400 text-center py-16">Voucher not found.</p>
        )}

        {!isLoading && !error && voucher && <VoucherDetailsInfo voucher={voucher} />}
      </div>
    </div>
  );
}
