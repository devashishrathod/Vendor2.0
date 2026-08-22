import { useState } from "react";
import { TRANSACTION_TYPES } from "../constants/transactionConstants";
import { cx } from "../utils/outletUtils";

function formatAmount(amount) {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TransactionSummaryPanel({ transactions }) {
  const [activeType, setActiveType] = useState(TRANSACTION_TYPES[0].value);
  const active = transactions?.[activeType];

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pb-6 border-b border-gray-100">
        {TRANSACTION_TYPES.map((type) => {
          const isActive = activeType === type.value;
          return (
            <div key={type.value}>
              <button
                onClick={() => setActiveType(type.value)}
                className={cx(
                  "text-sm text-left transition-colors",
                  isActive ? "font-bold text-gray-900" : "font-medium text-gray-500 hover:text-gray-700"
                )}
              >
                {type.label}
              </button>

              {isActive && active && (
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">₹ {formatAmount(active.amount)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={cx(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold",
                        active.deltaPercent >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                      )}
                    >
                      {active.deltaPercent >= 0 ? "+" : ""}
                      {active.deltaPercent}%
                    </span>
                    <span className="text-xs text-gray-600">
                      <b className="text-gray-800">Vs</b> Yesterday
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
