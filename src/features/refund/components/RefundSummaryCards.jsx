import { RefreshCcw, Wallet, ListChecks, Clock, CheckCircle2 } from "lucide-react";

function StatCard({ icon, label, amount, note }) {
  return (
    <div className="flex-1 px-6 py-4">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">{amount}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </div>
  );
}

// Same card layout as the Transactions page's SummaryCards — every value
// here is derived from the real GET /refunds rows currently in view.
export default function RefundSummaryCards({
  requestedAmount,
  totalCount,
  openCount,
  closedCount,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm mb-6">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Refund Overview</h3>
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
          label="Requested Amount"
          amount={requestedAmount}
          note="Matches the table's date range below"
        />
        <StatCard
          icon={<ListChecks className="h-4 w-4" />}
          label="Refund Requests"
          amount={totalCount}
          note="Total requests in view"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Open"
          amount={openCount}
          note="Still in progress"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Closed"
          amount={closedCount}
          note="Resolved requests"
        />
      </div>
    </div>
  );
}
