import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Crown } from "lucide-react";

// Same usage keys + labels the Subscription page's PlanBenefitsModal reads
// from the subscription response's `usage` object.
const USAGE_LABELS = {
  subBrands: "Sub Brands",
  franchises: "Franchises",
  vouchers: "Vouchers",
  showcase: "Showcase Sections",
};

const daysLeft = (iso) => {
  if (!iso) return null;
  const end = new Date(iso);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

/**
 * Current plan + how much of each plan limit is used, with bars that
 * animate in from zero.
 *
 * @param {{ subscription: object|null, loading?: boolean, error?: string }} props
 */
export default function PlanUsageCard({ subscription, loading = false, error = "" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const usageRows = Object.entries(subscription?.usage || {}).filter(([key]) => USAGE_LABELS[key]);
  const left = daysLeft(subscription?.expirationDate);

  return (
    <div className="bento-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-500/10">
            <Crown size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-300">
              {subscription?.planName || "Your Plan"}
            </p>
            <p className="text-[11px] text-gray-400">
              {left == null ? "Plan usage" : left < 0 ? "Expired" : `${left} days left`}
            </p>
          </div>
        </div>
        <Link
          to="/subscription-plan"
          className="flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold text-emerald-600 hover:underline"
        >
          Manage <ArrowUpRight size={13} />
        </Link>
      </div>

      {error ? (
        <p className="py-6 text-center text-xs text-rose-500">{error}</p>
      ) : loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-700/50" />
      ) : !subscription ? (
        <p className="py-6 text-center text-xs text-gray-400">No active subscription.</p>
      ) : usageRows.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">No usage data for this plan yet.</p>
      ) : (
        <div className="space-y-3.5">
          {usageRows.map(([key, u]) => {
            const used = u?.used ?? 0;
            const pct = u?.isUnlimited || !u?.limit ? 0 : Math.min(100, (used / u.limit) * 100);
            const barColor = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{USAGE_LABELS[key]}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {used}
                    <span className="font-normal text-gray-400"> / {u?.isUnlimited ? "∞" : u?.limit ?? "—"}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-out ${u?.isUnlimited ? "bg-emerald-300" : barColor}`}
                    style={{ width: mounted ? `${u?.isUnlimited ? 100 : pct}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
