import { RefreshCcw, Tag, Wallet, Percent, ReceiptText } from "lucide-react";

function StatCard({ icon, label, amount, note, showBreakup, count, isLast }) {
  return (
    <div className={`flex-1 px-6 py-4 ${!isLast ? "sm:border-r border-gray-100" : ""}`}>
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-800">{amount}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
      {showBreakup && (
        <button className="mt-1 text-xs font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
          Amount breakup
        </button>
      )}
      {typeof count === "number" && (
        <p className="mt-1 text-xs text-gray-400">No. of. Count : {count}</p>
      )}
    </div>
  );
}

// Restyled to match the Settlement page's "Settlement Overview" card
// exactly — same header + "Just Now" refresh row, same 4-column
// icon/label/big-value/note stat layout, same "Amount breakup" underlined
// links on the two flow-amount columns and "No. of. Count" on the other
// two. Transactions only has one tab wired to a real backend (voucher) —
// GSI stays an honest "Not available" column instead of a fabricated
// number, the same wording the Settlement card itself uses for a metric
// that has no data yet.
//
// The date-range control used to live here (a dropdown with presets) —
// moved into TransactionOverview's own toolbar instead, matching the
// Voucher/Settlements pages' filter-bar layout (search/status/date range/
// export all in one row), so this card is just the summary + refresh now.
export default function SummaryCards({
  voucherAmount,
  voucherCount,
  overallPaidAmount,
  discountAmount,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm mb-6">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <h3 className="text-sm font-semibold text-gray-700">Transaction Overview</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600"
        >
          Just Now
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 divide-gray-100">
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Voucher Collection"
          amount={voucherAmount}
          note="Matches the table's date range below"
          showBreakup
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Overall Paid Amount"
          amount={overallPaidAmount}
          note="Total amount received across all vouchers"
          showBreakup
        />
        <StatCard
          icon={<Percent className="h-4 w-4" />}
          label="Discount Amount"
          amount={discountAmount}
          note="Total discount given to customers"
          count={voucherCount}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="GSI Collection"
          amount="₹ 0.00"
          note="Not available"
          count={0}
          isLast
        />
      </div>
    </div>
  );
}
