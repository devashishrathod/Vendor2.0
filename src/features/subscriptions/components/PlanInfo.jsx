import { formatINR } from "../utils/priceCalculator";

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
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100">
        Subscribe to {plan.name}
      </h2>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl font-extrabold text-gray-900">{formatINR(plan.price)}</span>
        <span className="text-gray-500 font-medium">/ {billingLabel(plan.type)}</span>
      </div>

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