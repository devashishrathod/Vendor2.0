// src/components/settlement/SettlementOverview.jsx
import React from "react";
import {
  RefreshCcw,
  Wallet,
  Clock3,
  CircleDollarSign,
  ReceiptText,
  X,
} from "lucide-react";

const currency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function StatCard({ icon, label, amount, note, showBreakup, count, isLast }) {
  return (
    <div className={`flex-1 px-6 py-4 ${!isLast ? "sm:border-r border-slate-100" : ""}`}>
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{currency(amount)}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
      {showBreakup && (
        <button className="mt-1 text-xs font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
          Amount breakup
        </button>
      )}
      {typeof count === "number" && (
        <p className="mt-1 text-xs text-slate-400">No. of. Count : {count}</p>
      )}
    </div>
  );
}

export default function SettlementOverview({
  overview,
  banner,
  holidayNotice,
  showBanner,
  setShowBanner,
  showHolidayNotice,
  setShowHolidayNotice,
  loading,
  onRefresh,
}) {
  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-slate-700">Settlement Overview</h3>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"
          >
            Just Now
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 divide-slate-100">
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Previous settlement"
            amount={overview?.previousSettlement?.amount}
            note={overview?.previousSettlement?.note}
            showBreakup
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Today settlement"
            amount={overview?.todaySettlement?.amount}
            note={overview?.todaySettlement?.note}
            showBreakup
          />
          <StatCard
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="Available balance"
            amount={overview?.availableBalance?.amount}
            note={overview?.availableBalance?.note}
            count={overview?.availableBalance?.count}
          />
          <StatCard
            icon={<ReceiptText className="h-4 w-4" />}
            label="GST balance"
            amount={overview?.gstBalance?.amount}
            note={overview?.gstBalance?.note}
            count={overview?.gstBalance?.count}
            isLast
          />
        </div>
      </div>

      {/* Latest settlement banner */}
      {showBanner && banner && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-5 py-3 text-white shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="font-semibold">{currency(banner.amount)}</span>
            <span className="text-indigo-100">{banner.label}</span>
            <span className="text-indigo-200">{banner.settlementId}</span>
            <span className="text-indigo-200">{banner.dateRange}</span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
          >
            Closed
          </button>
        </div>
      )}

      {/* Holiday notice */}
      {showHolidayNotice && holidayNotice && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-5 py-4 text-white shadow-sm">
          <button
            onClick={() => setShowHolidayNotice(false)}
            className="absolute right-3 top-3 text-emerald-200 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">🎅</span>
            <div>
              <p className="font-semibold">{holidayNotice.title}</p>
              <p className="mt-1 text-sm text-emerald-100 max-w-xl">
                {holidayNotice.message}
              </p>
            </div>
            <span className="ml-auto hidden sm:block text-2xl">🎄</span>
          </div>
        </div>
      )}
    </div>
  );
}
