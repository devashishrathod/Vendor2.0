import { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SUMMARY_CARDS = [
  {
    label: "Voucher Summary",
    amount: "₹ 7,256.00",
    change: "+74.6%",
    positive: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    label: "Deal Pack Summary",
    amount: "₹ 4,460.00",
    change: "+624%",
    positive: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
      </svg>
    ),
  },
  {
    label: "Membership Summary",
    amount: "₹ 4,244.00",
    change: "-20.00%",
    positive: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
      </svg>
    ),
  },
  {
    label: "GSI Summary",
    amount: "₹ 3,118.00",
    change: "-70.00%",
    positive: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const TRANSACTION_TABS = [
  { key: "Voucher Transaction",    icon: "voucher"     },
  { key: "Deal Pack Transaction",  icon: "dealpack"    },
  { key: "Membership Transaction", icon: "membership"  },
];

const VOUCHER_ROWS = [
  {
    bill:       "₹ 1,500.00",
    paid:       "₹ 814.00",
    discount:   "-₹ 3,89.00",
    additional: "-₹ 0.00",
    got:        "₹ 80.00",
  },
];

// ─── Small icon helper ────────────────────────────────────────────────────────
function TxnIcon({ type }) {
  if (type === "voucher")
    return (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    );
  if (type === "dealpack")
    return (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
      </svg>
    );
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab,    setActiveTab]    = useState("Analysis Report");
  const [activeTxnTab, setActiveTxnTab] = useState("Voucher Transaction");
  const [rowsPerPage,  setRowsPerPage]  = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [collapsed,    setCollapsed]    = useState(false);

  const totalPages = 8;

  const sectionTitle = activeTxnTab.replace(" Transaction", " Overview");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Header — alag component, kabhi nahi badlega ── */}
      <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Page body ── */}
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
            <button className="text-emerald-600 font-semibold hover:underline">
              Today
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {SUMMARY_CARDS.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <span className="text-gray-300">{card.icon}</span>
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

        {/* Transaction type tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {TRANSACTION_TABS.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTxnTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold
                border transition-all duration-150
                ${activeTxnTab === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <TxnIcon type={icon} />
              {key}
            </button>
          ))}
        </div>

        {/* Overview section */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">

          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              {sectionTitle}
            </div>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-gray-300 hover:text-gray-500 transition-colors"
              aria-label="Toggle section"
            >
              <svg
                width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}
                className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Table — collapse/expand */}
          {!collapsed && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Overall Bill Amount", "Coupon Paid Amount", "Discount Amount", "Additional discount", "Got Amount"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VOUCHER_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-700 font-medium">{row.bill}</td>
                        <td className="px-5 py-3.5 text-gray-700">{row.paid}</td>
                        <td className="px-5 py-3.5 text-red-500">{row.discount}</td>
                        <td className="px-5 py-3.5 text-red-500">{row.additional}</td>
                        <td className="px-5 py-3.5 text-gray-700">{row.got}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                {/* Rows per page */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Rows per page:</span>
                  {[10, 20, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRowsPerPage(n)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors
                        ${rowsPerPage === n
                          ? "bg-emerald-500 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Pages */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors
                        ${currentPage === page
                          ? "bg-emerald-500 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}