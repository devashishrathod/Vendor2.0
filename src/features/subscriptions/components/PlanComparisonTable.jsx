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
import { FeatureIcon, CheckIcon, CrossIcon } from "./PlanIcons";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n || 0);

// The API only sends a feature "title" string, not an icon key — map common
// keywords to one of the icons PlanIcons already knows about.
function iconForTitle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("brand")) return "brand";
  if (t.includes("franchise")) return "franchise";
  if (t.includes("deal")) return "deal";
  if (t.includes("voucher")) return "voucher";
  if (t.includes("settlement")) return "settlement";
  if (t.includes("transaction")) return "transaction";
  if (t.includes("calendar") || t.includes("date")) return "calendar";
  return "support";
}

export default function PlanComparisonTable({ plans = [], selectedId, loading = false }) {
  if (loading) {
    return (
      <div className="mt-12">
        <div className="h-8 w-64 bg-gray-100 rounded mx-auto mb-8 animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
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

  // Union of every feature title across all plans, in first-seen order.
  const featureTitles = [];
  plans.forEach((p) =>
    (p.features || []).forEach((f) => {
      if (!featureTitles.includes(f.title)) featureTitles.push(f.title);
    })
  );

  const gridTemplate = { gridTemplateColumns: `minmax(0,1.4fr) repeat(${plans.length}, minmax(0,1fr))` };

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-1">Plan Comparison</h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        Compare different plans and select the one that fits your requirements best.
      </p>

      <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 overflow-x-auto">
        {/* Header row */}
        <div className="grid px-6 py-5 min-w-[640px]" style={gridTemplate}>
          <div />
          {plans.map((plan) => (
            <div key={plan.id} className="text-center">
              <p className={`text-sm font-bold ${selectedId === plan.id ? "text-violet-600" : "text-gray-800"}`}>
                {plan.label}
              </p>
              <p className={`text-xs mt-1 font-semibold ${selectedId === plan.id ? "text-violet-500" : "text-gray-400"}`}>
                ₹ {fmt(plan.price)}
              </p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {featureTitles.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            None of these plans have features listed yet.
          </div>
        ) : (
          featureTitles.map((title, i) => (
            <div
              key={title}
              className={`grid px-6 py-4 items-center min-w-[640px] ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              style={gridTemplate}
            >
              {/* Feature name */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FeatureIcon name={iconForTitle(title)} />
                </div>
                <span className="text-sm font-medium text-gray-700">{title}</span>
              </div>

              {/* Value per plan */}
              {plans.map((plan) => {
                const feature = (plan.features || []).find((f) => f.title === title);

                if (!feature) {
                  return (
                    <div key={plan.id} className="flex justify-center text-sm text-gray-300">
                      —
                    </div>
                  );
                }

                const isYesNo = feature.value === "Yes" || feature.value === "No";

                return (
                  <div key={plan.id} className="flex justify-center">
                    {isYesNo ? (
                      feature.available ? <CheckIcon /> : <CrossIcon />
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          plan.id === selectedId ? "text-violet-600 font-semibold" : "text-gray-600"
                        }`}
                      >
                        {feature.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}