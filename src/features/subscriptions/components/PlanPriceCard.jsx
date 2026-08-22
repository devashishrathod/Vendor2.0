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

export default function PlanPriceCard({ plans = [], selectedId, onPurchase, loading = false }) {
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

  return (
    <div className="text-center py-6">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-1">Subscribe to {plan.name}</h2>
      {plan.description && <p className="text-sm text-gray-400 mb-5">{plan.description}</p>}

      {/* Price row */}
      <div className="flex items-baseline justify-center gap-3 mb-2">
        <span className="text-4xl font-bold text-gray-900">₹ {fmt(plan.price)}</span>
        <span className="text-gray-400 text-base font-medium">/ {billingLabel(plan.type)}</span>
      </div>

      {plan.durationInDays ? (
        <p className="text-xs text-gray-400 mb-6">Access for {durationLabel(plan.durationInDays)}</p>
      ) : (
        <div className="mb-6" />
      )}

      

      {/* Purchase button */}
      <button
        onClick={() => onPurchase(plan)}
        className="w-full max-w-xl mx-auto flex items-center justify-center py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-base tracking-wide transition-all duration-200 shadow-lg shadow-emerald-200"
      >
        Purchase Now
      </button>
    </div>
  );
}
