// // ── Plan comparison table ─────────────────────────────────────────────────────
// import { PLANS, COMPARISON_ROWS } from "@/utils/Plandata";
// import { FeatureIcon, CheckIcon, CrossIcon } from "./PlanIcons";

// const fmt = (n) =>
//   new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

// export default function PlanComparisonTable({ selectedId }) {
//   return (
//     <div className="mt-12">
//       <h2 className="text-3xl font-bold text-gray-900 text-center mb-1">
//         Plan Comparison
//       </h2>
//       <p className="text-sm text-gray-400 text-center mb-8">
//         Compare different plans and select the one that fits your requirements
//         best.
//       </p>

//       {/* Table wrapper */}
//       <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
//         {/* Header row */}
//         <div className="grid grid-cols-5 px-6 py-5">
//           <div /> {/* feature label column */}
//           {PLANS.map((plan) => (
//             <div key={plan.id} className="text-center">
//               <p
//                 className={`text-sm font-bold ${selectedId === plan.id ? "text-violet-600" : "text-gray-800"}`}
//               >
//                 {plan.label} Plan
//               </p>
//               <p
//                 className={`text-xs mt-1 font-semibold ${selectedId === plan.id ? "text-violet-500" : "text-gray-400"}`}
//               >
//                 ₹ {fmt(plan.price)}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* Rows */}
//         {COMPARISON_ROWS.map((row, i) => (
//           <div
//             key={row.feature}
//             className={`grid grid-cols-5 px-6 py-4 items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
//           >
//             {/* Feature name */}
//             <div className="flex items-center gap-2.5">
//               <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
//                 <FeatureIcon name={row.icon} />
//               </div>
//               <span className="text-sm font-medium text-gray-700">
//                 {row.feature}
//               </span>
//             </div>

//             {/* Values per plan */}
//             {row.values.map((val, vi) => (
//               <div key={vi} className="flex justify-center">
//                 {typeof val === "boolean" ? (
//                   val ? (
//                     <CheckIcon />
//                   ) : (
//                     <CrossIcon />
//                   )
//                 ) : (
//                   <span
//                     className={`text-sm font-medium ${
//                       PLANS[vi].id === selectedId
//                         ? "text-violet-600 font-semibold"
//                         : "text-gray-600"
//                     }`}
//                   >
//                     {val}
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


// ── Plan comparison table — rows built from each plan's `features` array ──────
// Every row is a real `features[].title` from the plans API (e.g. "Sub
// Brands", "Business Profile", "Analytics", "Franchise Management"), in the
// order the plans list them. Nothing else is added — an earlier version
// also derived rows from `entitlements` under its own hardcoded labels
// ("Sub Brand", "Franchise", "Voucher"), which showed up as near-duplicate
// rows next to the real ones.
import {
  BadgePercent,
  BarChart3,
  GitFork,
  Headphones,
  Images,
  Layers,
  Package,
  Sparkles,
  Store,
  Ticket,
} from "lucide-react";
import { CheckIcon, CrossIcon } from "./PlanIcons";
import { computeEffectivePrice } from "../utils/priceCalculator";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n || 0);

// The API only sends a feature "title", not an icon — pick one by keyword.
const TITLE_ICONS = [
  ["sub brand", Layers],
  ["profile", Store],
  ["analytic", BarChart3],
  ["voucher", Ticket],
  ["deal", Package],
  ["offer", BadgePercent],
  ["showcase", Images],
  ["franchise", GitFork],
  ["support", Headphones],
];

function iconForTitle(title = "") {
  const t = title.toLowerCase();
  return TITLE_ICONS.find(([keyword]) => t.includes(keyword))?.[1] || Sparkles;
}

// One plan's cell for one feature row. `available: false` → ✗. A feature
// that's available but has no value text (e.g. Priority Support: "") or a
// plain "Yes" → ✓. Otherwise the value text itself ("Up to 3", "Enhanced").
function FeatureValue({ feature, highlighted }) {
  if (!feature) return <span className="text-sm text-gray-300">—</span>;
  const value = String(feature.value ?? "").trim();
  if (!feature.available || value.toLowerCase() === "no") return <CrossIcon />;
  if (!value || value.toLowerCase() === "yes") return <CheckIcon />;
  return (
    <span
      className={`text-sm font-medium text-center ${
        highlighted ? "text-violet-600 font-semibold" : "text-gray-600 dark:text-gray-300"
      }`}
    >
      {value}
    </span>
  );
}

export default function PlanComparisonTable({ plans = [], selectedId, onSelect, loading = false }) {
  if (loading) {
    return (
      <div className="mt-12">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-700 rounded mx-auto mb-8 animate-pulse" />
        <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="mt-12 text-center text-sm text-gray-400">
        No plans available to compare right now.
      </div>
    );
  }

  // Union of every feature title across all plans, in first-seen order
  // (plans arrive sorted cheapest → priciest from useSubscriptionPlans).
  const featureTitles = [];
  plans.forEach((p) =>
    (p.features || []).forEach((f) => {
      if (f?.title && !featureTitles.includes(f.title)) featureTitles.push(f.title);
    })
  );

  const gridTemplate = { gridTemplateColumns: `minmax(0,1.4fr) repeat(${plans.length}, minmax(0,1fr))` };

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-1">Plan Comparison</h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        Compare different plans and select the one that fits your requirements best.
      </p>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden overflow-x-auto">
        {/* Header row */}
        <div className="grid px-6 py-5 min-w-[640px]" style={gridTemplate}>
          <div />
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect?.(plan.id)}
              className="text-center rounded-lg py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <p className={`text-sm font-bold ${selectedId === plan.id ? "text-violet-600" : "text-gray-800 dark:text-gray-100"}`}>
                {plan.label}
              </p>
              {plan.durationLabel && (
                <p className="text-xs mt-0.5 text-gray-400">{plan.durationLabel}</p>
              )}
              <p className={`text-xs mt-1 font-semibold ${selectedId === plan.id ? "text-violet-500" : "text-gray-400"}`}>
                ₹ {fmt(plan.discountedPrice ?? computeEffectivePrice(plan))}
              </p>
            </button>
          ))}
        </div>

        {/* Rows */}
        {featureTitles.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            None of these plans have features listed yet.
          </div>
        ) : (
          featureTitles.map((title, i) => {
            const Icon = iconForTitle(title);
            return (
              <div
                key={title}
                className={`grid px-6 py-4 items-center min-w-[640px] ${i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}`}
                style={gridTemplate}
              >
                {/* Feature name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
                </div>

                {/* Value per plan */}
                {plans.map((plan) => (
                  <div key={plan.id} className="flex justify-center">
                    <FeatureValue
                      feature={(plan.features || []).find((f) => f.title === title)}
                      highlighted={plan.id === selectedId}
                    />
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
