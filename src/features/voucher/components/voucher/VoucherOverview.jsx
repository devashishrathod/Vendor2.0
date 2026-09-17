// src/components/voucher/VoucherOverview.jsx
import {
  RefreshCcw,
  Wallet,
  Tag,
  ReceiptText,
  CalendarX,
} from "lucide-react";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Same card style as the Transactions page's "Transaction Overview" card
// (SummaryCards.jsx) — icon + label header, one large bold value, note
// line, optional "Amount breakup" link or "No. of. Count" line.
function StatCard({ icon, label, value, note, showBreakup, count, valueClassName = "", isLast }) {
  return (
    <div className={`flex-1 px-6 py-4 ${!isLast ? "sm:border-r border-gray-100 dark:border-gray-700" : ""}`}>
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100 ${valueClassName}`}>{value}</p>
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

// Same shape as the Transactions page's Transaction Overview card — header
// row (title + refresh), one stats strip below it. "Overall Paid Amount"
// and "Additional Discount" removed per explicit instruction (redundant
// with Overall Collection Amount, and no confirmed real data source).
export default function VoucherOverview({ stats, isLoading, refreshing, onRefresh }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Voucher Overview</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600"
        >
          Just Now
          <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Overall Collection Amount"
          value={isLoading ? "—" : formatCurrency(stats?.overallCollectionAmount)}
          note="Total amount received across all vouchers"
          showBreakup
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Discount Amount"
          value={isLoading ? "—" : `-${formatCurrency(Math.abs(stats?.discountAmount ?? 0))}`}
          note="Total discount given to customers"
          valueClassName={isLoading ? undefined : "text-rose-500"}
          count={isLoading ? undefined : stats?.transactionCount ?? 0}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Gst Amount"
          value={isLoading ? "—" : formatCurrency(stats?.gstAmount)}
          note="Not available"
        />
        <StatCard
          icon={<CalendarX className="h-4 w-4" />}
          label="Expired Voucher"
          value={isLoading ? "—" : stats?.expiredVoucherCount ?? 0}
          note={isLoading ? undefined : `No. of. Count : ${stats?.expiredVoucherCount ?? 0}`}
          isLast
        />
      </div>
    </div>
  );
}
