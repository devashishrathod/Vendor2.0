import DashboardHeader from "../components/DashboardHeader";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Total Revenue",    value: "₹ 84,320.00", change: "+12.4%", positive: true  },
  { label: "Total Orders",     value: "1,248",        change: "+8.2%",  positive: true  },
  { label: "Avg Order Value",  value: "₹ 675.00",    change: "-3.1%",  positive: false },
  { label: "Refunds Issued",   value: "₹ 2,140.00",  change: "-18.5%", positive: false },
];

const TOP_PRODUCTS = [
  { name: "Voucher — Weekend Special",  revenue: "₹ 28,400",  orders: 312, share: 72 },
  { name: "Deal Pack — Family Combo",   revenue: "₹ 19,600",  orders: 210, share: 54 },
  { name: "Membership — Gold",          revenue: "₹ 15,200",  orders: 98,  share: 38 },
  { name: "Voucher — Happy Hours",      revenue: "₹ 11,800",  orders: 187, share: 29 },
  { name: "Deal Pack — Solo Saver",     revenue: "₹ 9,320",   orders: 143, share: 22 },
];

const MONTHLY = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 58 },
  { month: "Mar", value: 51 },
  { month: "Apr", value: 73 },
  { month: "May", value: 65 },
  { month: "Jun", value: 88 },
  { month: "Jul", value: 79 },
];

const max = Math.max(...MONTHLY.map((m) => m.value));

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnalysisReport() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <DashboardHeader />

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
          <p className="text-xs text-gray-400 mt-1">
            Business performance overview · Updated daily
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${s.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {s.change} vs last month
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* ── Bar chart ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue</p>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{m.value}k</span>
                  <div
                    className="w-full rounded-t-md bg-emerald-400 transition-all duration-300"
                    style={{ height: `${(m.value / max) * 100}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Category split ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Voucher",    pct: 46, color: "bg-emerald-400" },
                { label: "Deal Pack",  pct: 31, color: "bg-purple-400"  },
                { label: "Membership", pct: 23, color: "bg-amber-400"   },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{c.label}</span>
                    <span className="font-semibold text-gray-700">{c.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Top products table ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Top Performing Products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Product", "Revenue", "Orders", "Share"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{row.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{row.revenue}</td>
                    <td className="px-5 py-3.5 text-gray-500">{row.orders}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${row.share}%` }} />
                        </div>
                        <span className="text-gray-500 w-6 text-right">{row.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}