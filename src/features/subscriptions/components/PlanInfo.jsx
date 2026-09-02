import { formatINR, amountToWords, computeEffectivePrice } from "../utils/priceCalculator";

const billingLabel = (type) => (type === "MONTHLY" ? "Monthly" : "Yearly");

const durationLabel = (days) => {
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
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100">
        Subscribe to {plan.name}
      </h2>

      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl font-extrabold text-gray-900">{formatINR(effectivePrice)}</span>
        <span className="text-gray-500 font-medium">/ {billingLabel(plan.type)}</span>
      </div>

      {(strikeReference != null || discountLabel) && (
        <div className="flex items-center gap-3 mb-2">
          {strikeReference != null && (
            <span className="text-gray-400 line-through text-sm">{formatINR(strikeReference)}</span>
          )}
          {discountLabel && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-md">
              {discountLabel}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-6">{amountToWords(effectivePrice)} Rupees Only</p>

      {plan.description && <p className="text-sm text-gray-500 mb-6">{plan.description}</p>}

      <div className="mb-5">
        <p className="text-sm font-bold text-gray-800 mb-1">Plan Duration</p>
        <p className="text-sm text-gray-600">{durationLabel(plan.durationInDays)}</p>
      </div>

      {/* {(plan.benefits?.length > 0 || plan.limitations?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {plan.benefits?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1.5">Benefits</p>
              <ul className="space-y-1">
                {plan.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.limitations?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1.5">Limitations</p>
              <ul className="space-y-1">
                {plan.limitations.map((l, i) => (
                  <li key={i} className="text-sm text-gray-500 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}