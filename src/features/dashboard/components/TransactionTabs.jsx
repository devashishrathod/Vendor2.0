import TxnIcon from "./TxnIcon";
import { TRANSACTION_TABS } from "../data/transactionData";

// ─── Transaction type tabs — clicking one switches the overview below ─────
export default function TransactionTabs({ activeTxnTab, setActiveTxnTab }) {
  return (
    <div className="flex justify-center mb-5">
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {TRANSACTION_TABS.map(({ key, label, icon }, index) => (
          <div key={key} className="flex items-center">
            {/* Divider before the last tab, like in the reference design */}
            {index === TRANSACTION_TABS.length - 1 && (
              <span className="w-px h-4 bg-gray-300 mx-1" />
            )}
            <button
              onClick={() => setActiveTxnTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150
                ${activeTxnTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <TxnIcon type={icon} />
              {label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}