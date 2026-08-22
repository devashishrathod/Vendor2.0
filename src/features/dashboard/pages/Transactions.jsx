import { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import SummaryCards from "../components/SummaryCards";
import TransactionTabs from "../components/TransactionTabs";
import TransactionOverview from "../components/TransactionOverview";

// ─── Transactions Page (dashboard feature ke andar ek page) ───────────────
// Ye poora dashboard nahi hai — sirf "Transaction's Overview" wala page hai,
// jaisa AnalysisReport.jsx hai waisa hi ek sibling page.
// activeTxnTab state yahan hold hota hai aur TransactionOverview ko
// prop ke through pass hota hai — jab tab badlega, overview khud-ba-khud
// naya data (stats + table) dikhayega. Ab har cheez ek hi jagah control hoti hai.
export default function Transactions() {
  const [activeTxnTab, setActiveTxnTab] = useState("voucher");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header — apna routing khud NavLink se handle karta hai, koi prop nahi chahiye */}
     

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Page heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction's Overview</h1>
          <p className="text-xs text-gray-400 mt-1">
            "Fast, safe, and effortless payments." This information will be automatically deleted after 24 hours.
          </p>
        </div>

        {/* Overall collection */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Overall Collection Amount</p>
            <p className="text-2xl font-bold text-gray-900">₹ 19,078.00</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Nb Of Count: <strong className="text-gray-700">16</strong>
            </span>
            <button className="text-emerald-600 font-semibold hover:underline">Today</button>
          </div>
        </div>

        {/* Top 4 summary cards — static */}
        <SummaryCards />

        {/* Tabs — controls activeTxnTab */}
        <TransactionTabs activeTxnTab={activeTxnTab} setActiveTxnTab={setActiveTxnTab} />

        {/* Overview section — reacts to activeTxnTab */}
        <TransactionOverview activeTxnTab={activeTxnTab} />
      </div>
    </div>
  );
}