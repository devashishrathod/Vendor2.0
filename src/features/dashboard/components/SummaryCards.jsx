import { SUMMARY_CARDS } from "../data/transactionData";

// ─── Top 4 summary cards — these stay constant regardless of active tab ───
export default function SummaryCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {SUMMARY_CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{card.amount}</p>
          <span
            className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full
              ${card.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
              }`}
          >
            {card.change} vs Yesterday
          </span>
        </div>
      ))}
    </div>
  );
}
