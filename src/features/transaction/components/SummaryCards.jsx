import { SUMMARY_CARDS } from "../data/transactionData";

// ─── Top 4 summary cards — Voucher Summary uses the real paid-amount total
// (passed in as `voucherAmount`, the only tab with a live API); Deal Pack /
// Membership / GSI stay on their static placeholder numbers until those
// backend endpoints exist.
export default function SummaryCards({ voucherAmount }) {
  return (
    <div className={`grid grid-cols-2 gap-3 mb-6 ${SUMMARY_CARDS.length > 2 ? "md:grid-cols-4" : ""}`}>
      {SUMMARY_CARDS.map((card) => {
        const isVoucher = card.key === "voucher";
        const amount = isVoucher && voucherAmount != null ? voucherAmount : card.amount;
        return (
          <div
            key={card.key}
            className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{amount}</p>
            {/* No real day-over-day comparison exists for the voucher total
                yet, so don't show a fabricated "+X% vs Yesterday" badge on it. */}
            {isVoucher ? null : (
              <span
                className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full
                  ${card.positive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                  }`}
              >
                {card.change} vs Yesterday
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
