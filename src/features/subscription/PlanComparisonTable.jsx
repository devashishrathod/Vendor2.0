// ── Plan comparison table ─────────────────────────────────────────────────────
import { PLANS, COMPARISON_ROWS } from "@/utils/Plandata";
import { FeatureIcon, CheckIcon, CrossIcon } from "./PlanIcons";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

export default function PlanComparisonTable({ selectedId }) {
  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-1">
        Plan Comparison
      </h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        Compare different plans and select the one that fits your requirements
        best.
      </p>

      {/* Table wrapper */}
      <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
        {/* Header row */}
        <div className="grid grid-cols-5 px-6 py-5">
          <div /> {/* feature label column */}
          {PLANS.map((plan) => (
            <div key={plan.id} className="text-center">
              <p
                className={`text-sm font-bold ${selectedId === plan.id ? "text-violet-600" : "text-gray-800"}`}
              >
                {plan.label} Plan
              </p>
              <p
                className={`text-xs mt-1 font-semibold ${selectedId === plan.id ? "text-violet-500" : "text-gray-400"}`}
              >
                ₹ {fmt(plan.price)}
              </p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {COMPARISON_ROWS.map((row, i) => (
          <div
            key={row.feature}
            className={`grid grid-cols-5 px-6 py-4 items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            {/* Feature name */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FeatureIcon name={row.icon} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {row.feature}
              </span>
            </div>

            {/* Values per plan */}
            {row.values.map((val, vi) => (
              <div key={vi} className="flex justify-center">
                {typeof val === "boolean" ? (
                  val ? (
                    <CheckIcon />
                  ) : (
                    <CrossIcon />
                  )
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      PLANS[vi].id === selectedId
                        ? "text-violet-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {val}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
