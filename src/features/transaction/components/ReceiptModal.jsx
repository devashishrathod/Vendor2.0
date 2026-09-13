// On-screen receipt preview, replacing the old plain-.txt download — there's
// still no confirmed backend "receipt PDF" endpoint, so this stays
// client-side, built purely from the real order data already loaded on the
// page. "Print / Save as PDF" uses the browser's own print dialog (choosing
// "Save as PDF" there needs no extra library) via a print-only CSS rule that
// hides everything on the page except the #receipt-print-area below.
export default function ReceiptModal({ order, typeConfig, onClose }) {
  const row = (label, value) =>
    value ? (
      <div className="flex items-start justify-between gap-3 py-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-800 text-right">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { position: fixed; inset: 0; margin: 0; box-shadow: none; border: none; }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div id="receipt-print-area" className="p-6">
          <div className="text-center mb-5">
            <p className="text-lg font-extrabold text-emerald-600 tracking-tight">TRYDOOD</p>
            <p className="text-xs text-gray-400 mt-0.5">Payment Receipt</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400">Order Id</p>
              <p className="text-sm font-bold text-gray-900">{order.orderId || "—"}</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {order.status || "Active"}
            </span>
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="space-y-0.5">
            {row(typeConfig.idFieldLabel, order.refId)}
            {row("Voucher Name", order.voucherName)}
            {row("Outlet Location", order.outlet)}
            {row("Store Id", order.storeId)}
            {row("Store Type", order.storeType)}
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="space-y-0.5">
            {row("Bill Amount", order.billAmount)}
            {row("Discount Amount", order.discountAmount)}
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-bold text-gray-900">Paid Amount</span>
            <span className="text-lg font-bold text-emerald-600">{order.paidAmount || "—"}</span>
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="space-y-0.5">
            {row("Payment Method", order.paymentMethod)}
            {row("Payment Transaction Id", order.paymentTransactionId)}
            {row("Date & Time", order.paymentDateTime)}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">Thank you for your business!</p>
          <p className="text-center text-[10px] text-gray-300 mt-1">Trydood Retail Private Limited</p>
        </div>

        <div className="flex items-center gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-xl px-4 py-2.5 transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
