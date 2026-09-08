import { useState, useEffect, useMemo, useRef } from "react";
import SummaryCards from "../components/SummaryCards";
import TransactionTabs from "../components/TransactionTabs";
import TransactionOverview from "../components/TransactionOverview";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import useBrandData from "@/features/brand/hooks/useBrandData";
import { fetchVoucherTransactionOverview } from "../services/transactionService";

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DATE_RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7days", label: "Last 7 Days" },
];

// Start-of-day boundary for the selected range, in local time.
function getRangeStart(range) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (range === "yesterday") {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (range === "7days") {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - 6);
    return d;
  }
  return startOfToday; // "today"
}

function isWithinRange(iso, range) {
  if (!iso) return false;
  const date = new Date(iso);
  const start = getRangeStart(range);
  if (range === "yesterday") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }
  return date >= start;
}

// ─── Transactions Page (own feature — moved out of dashboard) ─────────────
// Ye poora dashboard nahi hai — sirf "Transaction's Overview" wala page hai,
// jaisa AnalysisReport.jsx hai waisa hi ek sibling page.
// activeTxnTab state yahan hold hota hai aur TransactionOverview ko
// prop ke through pass hota hai — jab tab badlega, overview khud-ba-khud
// naya data (stats + table) dikhayega. Ab har cheez ek hi jagah control hoti hai.
//
// Voucher data (the only tab wired to a real API) is fetched HERE, once,
// and passed down to both SummaryCards and TransactionOverview — so the
// "Overall Collection Amount" header, the Voucher Summary card, and the
// table below never disagree with each other. The Yesterday/Today/Last 7
// Days dropdown filters that same real data by `raw.createdAt`.
export default function Transactions() {
  const [activeTxnTab, setActiveTxnTab] = useState("voucher");
  const [dateRange, setDateRange] = useState("today");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const rangeMenuRef = useRef(null);

  useEffect(() => {
    if (!rangeMenuOpen) return;
    const handleClickOutside = (e) => {
      if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target)) {
        setRangeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [rangeMenuOpen]);

  // Same brandId-resolution pattern as useVoucher.js: prefer the
  // onboarding/auth-cached id, then round-trip through GET /brands/get so
  // we filter by the backend's own confirmed brand._id.
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  const [voucherData, setVoucherData] = useState(null);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    if (!resolvedBrandId) return;
    let cancelled = false;
    fetchVoucherTransactionOverview({ brandId: resolvedBrandId })
      .then((result) => {
        if (cancelled) return;
        setVoucherData(result);
        setVoucherError("");
      })
      .catch((err) => {
        if (!cancelled) setVoucherError(err.message || "Failed to load transactions.");
        console.error("Failed to load voucher transactions:", err.message);
      });
    return () => { cancelled = true; };
  }, [resolvedBrandId]);

  // Re-filters the real voucher rows by the selected date range and
  // recomputes the total/count from that filtered subset, so the header,
  // the summary card, and the table below all agree.
  const filteredVoucherData = useMemo(() => {
    if (!voucherData) return null;
    const rows = voucherData.rows.filter((row) => isWithinRange(row.raw?.createdAt, dateRange));
    const totalPaidAmount = rows.reduce((acc, row) => acc + Number(row.raw?.amount || 0), 0);
    return { ...voucherData, rows, totalPaidAmount, count: rows.length };
  }, [voucherData, dateRange]);

  const activeRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.key === dateRange)?.label;

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

        {voucherError && (
          <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5 text-center">
            {voucherError}
          </p>
        )}

        {/* Overall collection — voucher's real paid-amount total/count for
            the selected date range (the only tab with a live API); deal
            pack/membership don't have a backend endpoint yet so they
            aren't folded into this total. */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Overall Collection Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatINR(filteredVoucherData?.totalPaidAmount)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Nb Of Count: <strong className="text-gray-700">{filteredVoucherData?.count ?? 0}</strong>
            </span>
            <div className="relative" ref={rangeMenuRef}>
              <button
                onClick={() => setRangeMenuOpen((o) => !o)}
                className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
              >
                {activeRangeLabel}
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  className={`transition-transform duration-150 ${rangeMenuOpen ? "rotate-180" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {rangeMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setDateRange(opt.key); setRangeMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50
                        ${dateRange === opt.key ? "text-emerald-600 font-semibold" : "text-gray-600"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top 4 summary cards — Voucher card always shows the real total
            (for the selected date range), even while still ₹0.00 before the
            fetch resolves — never the old dummy fallback, so no fabricated
            number ever flashes here. The rest stay static until their own
            backend endpoints exist. */}
        <SummaryCards voucherAmount={formatINR(filteredVoucherData?.totalPaidAmount)} />

        {/* Tabs — controls activeTxnTab */}
        <TransactionTabs activeTxnTab={activeTxnTab} setActiveTxnTab={setActiveTxnTab} />

        {/* Overview section — reacts to activeTxnTab */}
        <TransactionOverview activeTxnTab={activeTxnTab} voucherData={filteredVoucherData} />
      </div>
    </div>
  );
}
