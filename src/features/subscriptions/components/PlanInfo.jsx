import { BadgePercent, CalendarDays, Crown } from "lucide-react";
import { formatINR, amountToWords, computeEffectivePrice } from "../utils/priceCalculator";

// Server-derived labels (typeLabel: "Weekly"/"Quarterly"/"18 Months",
// durationLabel: "7 days"/"3 months") — `type` alone can't describe CUSTOM
// lengths and `durationInDays` no longer exists on the plan.
const billingLabel = (plan) => plan.typeLabel || plan.durationLabel || "Plan";

const legacyDurationLabel = (days) => {
  if (!days) return "—";
  if (days % 365 === 0) {
    const y = days / 365;
    return `${y} year${y > 1 ? "s" : ""}`;
  }
  if (days % 30 === 0) {
    const m = days / 30;
    return `${m} month${m > 1 ? "s" : ""}`;
  }
  return `${days} days`;
};

export default function PlanInfo({ plan }) {
  // plan.price (confirmed) is the pre-discount list price — the actual
  // amount charged comes from plan.discountPercent/discountAmount, same as
  // the subscription selection page's PlanPriceCard. Matches
  // pricing.taxableValue in the confirmed checkout-preview response
  // exactly (e.g. 10000 @ 50.01% off -> 4999).
  const effectivePrice = computeEffectivePrice(plan);
  const strikeReference =
    plan.strikePrice > effectivePrice ? plan.strikePrice : plan.price > effectivePrice ? plan.price : null;
  const discountLabel =
    plan.discountType === "PERCENT" && plan.discountPercent > 0
      ? `${Math.floor(plan.discountPercent)}% Off`
      : plan.discountAmount > 0
        ? `${formatINR(plan.discountAmount)} Off`
        : null;

  return (
    <section className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200/70 dark:bg-gray-800 dark:ring-gray-700">
      <header className="flex items-center gap-2.5 px-5 pb-0 pt-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Crown size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">Subscribe to {plan.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Your selected plan</p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{formatINR(effectivePrice)}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/ {billingLabel(plan)}</span>
            {strikeReference != null && <span className="text-sm text-gray-400 line-through">{formatINR(strikeReference)}</span>}
          </div>
          <p className="mt-1 text-xs text-gray-400">{amountToWords(effectivePrice)} Rupees Only</p>
          {plan.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <CalendarDays size={13} aria-hidden="true" />
            {plan.durationLabel || legacyDurationLabel(plan.durationInDays)}
          </span>
          {discountLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
              <BadgePercent size={13} aria-hidden="true" />
              {discountLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
