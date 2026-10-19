import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChevronRight, Wallet } from "lucide-react";
import AnimatedNumber from "@/components/common/AnimatedNumber";
import ChartTooltip from "@/components/charts/ChartTooltip";

const formatINR = (n) => `₹ ${Math.round(n || 0).toLocaleString("en-IN")}`;
const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—");

/**
 * Payout snapshot from real GET /settlements docs: amount still awaiting
 * payout (netPayable of every non-PAID settlement), the last paid payout,
 * and an animated bar chart of the most recent settlements' netPayable.
 *
 * @param {{ settlements: object[], loading?: boolean, error?: string }} props
 */
export default function SettlementSnapshot({ settlements = [], loading = false, error = "" }) {
  const { pendingAmount, pendingCount, lastPaid, recent } = useMemo(() => {
    const unpaid = settlements.filter((s) => s.status !== "PAID");
    const paid = settlements
      .filter((s) => s.status === "PAID" && s.paidAt)
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    const recentSix = [...settlements]
      .sort((a, b) => new Date(b.periodEnd || b.createdAt) - new Date(a.periodEnd || a.createdAt))
      .slice(0, 6)
      .reverse()
      .map((s) => ({
        label: shortDate(s.periodEnd || s.createdAt),
        value: s.netPayable ?? 0,
        paid: s.status === "PAID",
        heading: `${s.settlementNumber || "Settlement"} · ${s.statusLabel || s.status}`,
      }));
    return {
      pendingAmount: unpaid.reduce((sum, s) => sum + (s.netPayable || 0), 0),
      pendingCount: unpaid.length,
      lastPaid: paid[0] || null,
      recent: recentSix,
    };
  }, [settlements]);

  return (
    <div className="bento-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500 dark:bg-sky-500/10">
            <Wallet size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Settlements</p>
            <p className="text-[11px] text-gray-400">Your payouts at a glance</p>
          </div>
        </div>
        <Link to="/settlements" className="flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold text-emerald-600 hover:underline">
          View All <ChevronRight size={13} />
        </Link>
      </div>

      {error ? (
        <p className="py-6 text-center text-xs text-rose-500">{error}</p>
      ) : loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-700/50" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-sky-50/70 p-3 dark:bg-sky-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Awaiting payout</p>
              <AnimatedNumber value={pendingAmount} format={formatINR} className="mt-1 block text-lg font-bold text-gray-900 dark:text-gray-100" />
              <p className="text-[11px] text-gray-400">{pendingCount} settlement{pendingCount === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Last paid</p>
              <AnimatedNumber value={lastPaid?.netPayable ?? 0} format={formatINR} className="mt-1 block text-lg font-bold text-gray-900 dark:text-gray-100" />
              <p className="text-[11px] text-gray-400">{lastPaid ? shortDate(lastPaid.paidAt) : "No payouts yet"}</p>
            </div>
          </div>

          {recent.length > 0 ? (
            <div className="mt-4 flex-1">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={recent} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(14,165,233,0.06)" }}
                    content={
                      <ChartTooltip
                        formatValue={formatINR}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.heading}
                      />
                    }
                  />
                  <Bar dataKey="value" name="Net payable" radius={[6, 6, 0, 0]} barSize={22} animationDuration={1000}>
                    {recent.map((r, i) => (
                      <Cell key={i} fill={r.paid ? "var(--color-emerald-500)" : "#38bdf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> Pending</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-gray-400">No settlements yet.</p>
          )}
        </>
      )}
    </div>
  );
}
