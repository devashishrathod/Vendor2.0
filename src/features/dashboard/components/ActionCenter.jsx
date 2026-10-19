import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BadgeCheck, ChevronRight, Crown, Landmark, RotateCcw, ShieldAlert } from "lucide-react";

const DAY_MS = 86400000;
const RENEWAL_WARNING_DAYS = 30;

const daysUntil = (iso) => {
  if (!iso) return null;
  const end = new Date(iso);
  if (isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / DAY_MS);
};

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const TONES = {
  rose: "bg-rose-50 text-rose-500 dark:bg-rose-500/10",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
  sky: "bg-sky-50 text-sky-500 dark:bg-sky-500/10",
};

/**
 * "Needs your attention" list, built only from real data: open refund
 * requests awaiting the vendor's decision, an expiring/expired plan, and
 * missing PAN / bank / GST verification on the brand profile.
 *
 * @param {{ refunds: object[], subscription: object|null, brand: object|null, loading?: boolean }} props
 */
export default function ActionCenter({ refunds = [], subscription, brand, loading = false }) {
  const items = useMemo(() => {
    const list = [];

    const pendingRefunds = refunds.filter((r) => r.canDecide);
    if (pendingRefunds.length) {
      const nearest = pendingRefunds
        .map((r) => r.raw?.vendorRespondBy)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b))[0];
      list.push({
        key: "refunds",
        icon: RotateCcw,
        tone: "rose",
        title: `${pendingRefunds.length} refund request${pendingRefunds.length > 1 ? "s" : ""} need your decision`,
        detail: nearest ? `Respond by ${formatShortDate(nearest)}` : "Approve or reject from Refunds",
        to: "/refunds",
        cta: "Review",
      });
    }

    if (subscription) {
      const left = daysUntil(subscription.expirationDate);
      if (subscription.status === "EXPIRED" || (left != null && left < 0)) {
        list.push({ key: "plan", icon: Crown, tone: "rose", title: `Your ${subscription.planName} plan has expired`, detail: "Renew to keep your vouchers live", to: "/subscription-plan", cta: "Renew" });
      } else if (left != null && left <= RENEWAL_WARNING_DAYS) {
        list.push({ key: "plan", icon: Crown, tone: "amber", title: `${subscription.planName} plan ends in ${left} day${left === 1 ? "" : "s"}`, detail: "Renew early to avoid interruption", to: "/subscription-plan", cta: "Renew" });
      }
    }

    if (brand) {
      if (!brand.pan?.isVerified) {
        list.push({ key: "pan", icon: ShieldAlert, tone: "amber", title: "Business PAN not verified", detail: "Verify PAN to receive settlements", to: "/account-information", cta: "Verify" });
      }
      if (!brand.bank?.isVerified) {
        list.push({ key: "bank", icon: Landmark, tone: "amber", title: brand.bank ? "Bank account not verified" : "No bank account linked", detail: "Payouts need a verified bank account", to: "/account-information", cta: "Fix" });
      }
      // GST is optional for unregistered businesses — only flag one that's
      // on file but still unverified.
      if (brand.gst && !brand.gst.isVerified) {
        list.push({ key: "gst", icon: ShieldAlert, tone: "sky", title: "GST details not verified", detail: "Re-verify your GSTIN in Business Profile", to: "/account-information", cta: "Verify" });
      }
    }

    return list;
  }, [refunds, subscription, brand]);

  return (
    <div className="bento-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Needs your attention</p>
          <p className="text-[11px] text-gray-400">
            {loading ? "Checking…" : items.length ? `${items.length} item${items.length > 1 ? "s" : ""} to review` : "You're all caught up"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-700/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
            <BadgeCheck size={22} className="text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Everything looks good</p>
          <p className="text-[11px] text-gray-400">No pending refunds, renewals or verifications.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.key}
                className="animate-fade-up flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-700/40"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[item.tone]}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{item.title}</p>
                  <p className="truncate text-[11px] text-gray-400">{item.detail}</p>
                </div>
                <Link
                  to={item.to}
                  className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  {item.cta} <ChevronRight size={12} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
