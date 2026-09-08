// src/components/voucher/VoucherOverview.jsx
import {
  Wallet,
  CircleDollarSign,
  Tag,
  ReceiptText,
  BadgeCheck,
  CalendarX,
  Hourglass,
} from "lucide-react";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Same card style as SettlementOverview.jsx's StatCard — icon + label
// header, one large bold value, small note line below — instead of the
// smaller plain label/value pairs VoucherStatCard.jsx uses elsewhere.
function StatCard({ icon, label, value, note, valueClassName = "", isLast }) {
  return (
    <div className={`min-w-[170px] flex-1 px-6 py-4 ${!isLast ? "sm:border-r border-gray-100" : ""}`}>
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold text-gray-900 ${valueClassName}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
    </div>
  );
}

// Same shape as SettlementOverview.jsx's card — one header row (title +
// Live Updates), one stats strip below it. No separate collapsible toggle
// bar anymore; the voucher table below always shows.
export default function VoucherOverview({ stats, isLoading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">Voucher Overview</h3>
        <button className="text-sm font-medium text-indigo-600 hover:underline">
          Live Updates
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap divide-y sm:divide-y-0 divide-gray-100">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Overall Collection Amount"
          value={isLoading ? "—" : formatCurrency(stats?.overallCollectionAmount)}
        />
        <StatCard
          icon={<CircleDollarSign className="h-4 w-4" />}
          label="Overall Paid Amount"
          value={isLoading ? "—" : formatCurrency(stats?.overallPaidAmount)}
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Discount Amount"
          value={isLoading ? "—" : formatCurrency(stats?.discountAmount)}
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Additional Discount"
          value={isLoading ? "—" : `-${formatCurrency(Math.abs(stats?.additionalDiscount ?? 0))}`}
          // Only tinted while there's a real negative amount to show — the
          // "—" placeholder during loading stayed rose too, standing out
          // oddly next to every other card's plain gray placeholder.
          valueClassName={isLoading ? undefined : "text-rose-500"}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Gst Amount"
          value={isLoading ? "—" : formatCurrency(stats?.gstAmount)}
        />
        <StatCard
          icon={<BadgeCheck className="h-4 w-4" />}
          label="Active Voucher"
          value={isLoading ? "—" : stats?.activeVoucherCount ?? 0}
          note={isLoading ? undefined : `No. of. Count : ${stats?.activeVoucherCount ?? 0}`}
        />
        <StatCard
          icon={<CalendarX className="h-4 w-4" />}
          label="Expired Voucher"
          value={isLoading ? "—" : stats?.expiredVoucherCount ?? 0}
          note={isLoading ? undefined : `No. of. Count : ${stats?.expiredVoucherCount ?? 0}`}
        />
        <StatCard
          icon={<Hourglass className="h-4 w-4" />}
          label="Pending Voucher"
          value={isLoading ? "—" : stats?.pendingVoucherCount ?? 0}
          note={isLoading ? undefined : `No. of. Count : ${stats?.pendingVoucherCount ?? 0}`}
          isLast
        />
      </div>
    </div>
  );
}
