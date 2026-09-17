import { Wallet, Tag, ReceiptText } from "lucide-react";
import { TRANSACTION_TYPES } from "../constants/transactionConstants";
import { cx } from "../utils/outletUtils";

function formatAmount(amount) {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// One icon + accent color per transaction type, matching the reference
// design's three separate cards instead of one joined divide-x strip.
const TYPE_STYLES = {
  overall: { icon: Wallet, iconBg: "bg-emerald-50", iconText: "text-emerald-600", spark: "#10b981" },
  voucher: { icon: Tag, iconBg: "bg-blue-50", iconText: "text-blue-600", spark: "#3b82f6" },
  gst: { icon: ReceiptText, iconBg: "bg-violet-50", iconText: "text-violet-600", spark: "#8b5cf6" },
};

// fetchOutletTransactions only returns one aggregate {amount, deltaPercent}
// per type (confirmed mock data, no daily-history endpoint behind it) — so
// rather than invent a random-looking trend line, this draws a simple
// deterministic curve that actually rises or falls in the real
// deltaPercent's direction, instead of fabricating a shape unrelated to it.
function MiniSparkline({ deltaPercent, color }) {
  const rising = deltaPercent >= 0;
  const points = rising ? [30, 24, 27, 18, 21, 10, 13, 3] : [4, 11, 7, 17, 13, 23, 19, 29];
  const w = 84;
  const h = 32;
  const step = w / (points.length - 1);
  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${v}`).join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={areaPath} fill={color} opacity="0.12" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TransactionSummaryPanel({ transactions }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TRANSACTION_TYPES.map((type) => {
        const stat = transactions?.[type.value];
        const style = TYPE_STYLES[type.value] || TYPE_STYLES.overall;
        const Icon = style.icon;
        return (
          <div
            key={type.value}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <div className={cx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", style.iconBg, style.iconText)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-500">{type.label}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stat ? `₹ ${formatAmount(stat.amount)}` : "—"}
              </p>
              {stat && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={cx(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      stat.deltaPercent >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                    )}
                  >
                    {stat.deltaPercent >= 0 ? "↑" : "↓"} {Math.abs(stat.deltaPercent)}%
                  </span>
                  <span className="text-xs text-gray-500">vs Yesterday</span>
                </div>
              )}
            </div>
            {stat && <MiniSparkline deltaPercent={stat.deltaPercent} color={style.spark} />}
          </div>
        );
      })}
    </div>
  );
}
