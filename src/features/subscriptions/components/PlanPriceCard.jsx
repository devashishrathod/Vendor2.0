// // ── Price section — changes per selected tab ──────────────────────────────────
// import { PLANS } from "@/utils/Plandata";

// const fmt = (n) =>
//   new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

// export default function PlanPriceCard({ selectedId, onPurchase }) {
//   const plan = PLANS.find((p) => p.id === selectedId);
//   if (!plan) return null;

//   const planName = plan.label;

//   return (
//     <div className="text-center py-6">
//       {/* Title */}
//       <h2 className="text-3xl font-bold text-gray-900 mb-1">
//         Subscribe to {planName} Plan
//       </h2>
//       <p className="text-sm text-gray-400 mb-5">
//         One-time payment, one year access
//       </p>

//       {/* Price row */}
//       <div className="flex items-baseline justify-center gap-3 mb-2">
//         <span className="text-4xl font-bold text-gray-900">
//           ₹ {fmt(plan.price)}
//         </span>
//         <span className="text-gray-400 text-base font-medium">
//           / Yearly Plan
//         </span>
//       </div>

//       {/* Original + discount */}
//       <div className="flex items-center justify-center gap-3 mb-2">
//         <span className="text-gray-400 line-through text-sm">
//           ₹ {fmt(plan.originalPrice)}
//         </span>
//         <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-md">
//           {plan.discount} % Off
//         </span>
//       </div>

//       {/* In words */}
//       <p className="text-xs text-gray-400 mb-6">{plan.priceInWords}</p>

//       {/* Purchase button */}
//       <button
//         onClick={() => onPurchase(plan)}
//         className="w-full max-w-xl mx-auto flex items-center justify-center py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-base tracking-wide transition-all duration-200 shadow-lg shadow-emerald-200"
//       >
//         Purchase Now
//       </button>
//     </div>
//   );
// }


// ── Price section — changes per selected tab, sourced from the API ────────────
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { amountToWords, computeEffectivePrice } from "../utils/priceCalculator";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n || 0);

const billingLabel = (type) => (type === "MONTHLY" ? "Monthly Plan" : "Yearly Plan");

const durationLabel = (days) => {
  if (!days) return "";
  if (days % 365 === 0) {
    const yrs = days / 365;
    return `${yrs} year${yrs > 1 ? "s" : ""}`;
  }
  if (days % 30 === 0) {
    const mos = days / 30;
    return `${mos} month${mos > 1 ? "s" : ""}`;
  }
  return `${days} days`;
};

export default function PlanPriceCard({ plans = [], selectedId, onPurchase, loading = false, currentPlanName }) {
  const [showCurrentPlanModal, setShowCurrentPlanModal] = useState(false);

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="h-8 w-72 bg-gray-100 rounded mx-auto mb-4 animate-pulse" />
        <div className="h-10 w-40 bg-gray-100 rounded mx-auto mb-6 animate-pulse" />
        <div className="h-12 w-full max-w-xl bg-gray-100 rounded-xl mx-auto animate-pulse" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === selectedId);

  if (!plan) {
    return <div className="text-center py-10 text-sm text-gray-400">No plan selected.</div>;
  }

  // The API sends the pre-discount `price` plus discountPercent/
  // discountAmount, not a ready-made discounted total — this computes what
  // to actually display/charge. "Was" price shown struck-through is
  // whichever of strikePrice (an optional, separately-set higher marketing
  // reference) or the plan's own price is above that computed amount.
  const effectivePrice = computeEffectivePrice(plan);
  const strikeReference =
    plan.strikePrice > effectivePrice ? plan.strikePrice : plan.price > effectivePrice ? plan.price : null;
  const discountLabel =
    plan.discountType === "PERCENT" && plan.discountPercent > 0
      // "Point ke baad wali value" (e.g. the .025 in 50.025) is dropped,
      // not rounded — a truncated whole number for the badge.
      ? `${Math.floor(plan.discountPercent)}% Off`
      : plan.discountAmount > 0
        ? `₹ ${fmt(plan.discountAmount)} Off`
        : null;

  // The plan the vendor is already subscribed to (real, from GET
  // /subscribeds/get) — its Purchase button goes gray/disabled-looking
  // instead of letting them "buy" the plan they already have.
  const isCurrentPlan = !!currentPlanName && plan.name === currentPlanName;

  return (
    <div className="text-center py-6">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-1">Subscribe to {plan.name}</h2>
      {plan.description && <p className="text-sm text-gray-400 mb-5">{plan.description}</p>}

      {/* Price row */}
      <div className="flex items-baseline justify-center gap-3 mb-1">
        <span className="text-4xl font-bold text-gray-900">₹ {fmt(effectivePrice)}</span>
        <span className="text-gray-400 text-base font-medium">/ {billingLabel(plan.type)}</span>
      </div>

      {(strikeReference != null || discountLabel) && (
        <div className="flex items-center justify-center gap-3 mb-2">
          {strikeReference != null && (
            <span className="text-gray-400 line-through text-sm">₹ {fmt(strikeReference)}</span>
          )}
          {discountLabel && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-md">
              {discountLabel}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-2">{amountToWords(effectivePrice)} Rupees Only</p>

      {plan.durationInDays ? (
        <p className="text-xs text-gray-400 mb-6">Access for {durationLabel(plan.durationInDays)}</p>
      ) : (
        <div className="mb-6" />
      )}

      {/* Purchase button */}
      <button
        onClick={() => (isCurrentPlan ? setShowCurrentPlanModal(true) : onPurchase(plan))}
        className={`w-full max-w-xl mx-auto flex items-center justify-center py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200 ${
          isCurrentPlan
            ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
            : "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white shadow-lg shadow-emerald-200"
        }`}
      >
        {isCurrentPlan ? "Current Plan" : "Purchase Now"}
      </button>

      {showCurrentPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCurrentPlanModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">You're already on {plan.name}</h3>
            <p className="text-sm text-gray-500 mb-5">
              This is your current active plan, so there's nothing to purchase here. Pick a different plan above if
              you'd like to upgrade or switch.
            </p>
            <button
              onClick={() => setShowCurrentPlanModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
