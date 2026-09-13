import { useState, useEffect, useMemo } from "react";
import SummaryCards from "../components/SummaryCards";
// import TransactionTabs from "../components/TransactionTabs"; // not needed — see below
import TransactionOverview from "../components/TransactionOverview";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import useBrandData from "@/features/brand/hooks/useBrandData";
import { fetchVoucherTransactionOverview } from "../services/transactionService";

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Plain {from, to} date-picker range — same shape/UX as the Voucher and
// Settlements page toolbars (two native <input type="date"> values,
// "YYYY-MM-DD" strings, either side optional; both empty means no filter).
function isWithinRange(iso, { from, to }) {
  if (!iso) return false;
  const date = new Date(iso);
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (date > end) return false;
  }
  return true;
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
  const [activeTxnTab] = useState("voucher");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

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
  const [refreshing, setRefreshing] = useState(false);

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

  // Manual refresh (the card's "Refresh" button) — separate from the
  // mount/brand-change effect above so it can drive its own spinner.
  const handleRefresh = () => {
    if (!resolvedBrandId) return;
    setRefreshing(true);
    fetchVoucherTransactionOverview({ brandId: resolvedBrandId })
      .then((result) => {
        setVoucherData(result);
        setVoucherError("");
      })
      .catch((err) => {
        setVoucherError(err.message || "Failed to load transactions.");
        console.error("Failed to load voucher transactions:", err.message);
      })
      .finally(() => setRefreshing(false));
  };

  // Re-filters the real voucher rows by the selected date range and
  // recomputes the total/count from that filtered subset, so the summary
  // card and the table below always agree.
  const filteredVoucherData = useMemo(() => {
    if (!voucherData) return null;
    const rows = !dateRange.from && !dateRange.to
      ? voucherData.rows
      : voucherData.rows.filter((row) => isWithinRange(row.raw?.createdAt, dateRange));
    const totalPaidAmount = rows.reduce((acc, row) => acc + Number(row.raw?.amount || 0), 0);
    // Real confirmed field on each row's raw payment record — see
    // transactionService.js's mapPaymentRow comment (`voucher.offerDiscount`)
    // — same source the Voucher Overview tab's own "Discount Amount" stat uses.
    const totalDiscountAmount = rows.reduce((acc, row) => acc + Number(row.raw?.voucher?.offerDiscount || 0), 0);
    return { ...voucherData, rows, totalPaidAmount, totalDiscountAmount, count: rows.length };
  }, [voucherData, dateRange]);

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

        {/* Unified overview card — same visual language as the Settlement
            page's "Settlement Overview" card. Voucher Collection always
            shows the real total for the selected date range (even while
            still ₹0.00 before the fetch resolves — never a fabricated
            fallback number); GSI has no backend endpoint yet so it's an
            honest "Not available" column instead. */}
        <SummaryCards
          voucherAmount={formatINR(filteredVoucherData?.totalPaidAmount)}
          voucherCount={filteredVoucherData?.count ?? 0}
          overallPaidAmount={formatINR(filteredVoucherData?.totalPaidAmount)}
          discountAmount={formatINR(-(filteredVoucherData?.totalDiscountAmount || 0))}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {/* Tabs — commented out per instruction: with Deal Pack/Membership
            still hidden (no backend yet), Voucher Transaction is the only
            tab, so a tab bar with one option is unnecessary UI right now.
            Re-enable once another tab has a real backend.
        <TransactionTabs activeTxnTab={activeTxnTab} setActiveTxnTab={setActiveTxnTab} />
        */}

        {/* Overview section — reacts to activeTxnTab; owns the toolbar
            (search/status/date range/export) matching the Voucher and
            Settlements pages' filter bar. */}
        <TransactionOverview
          activeTxnTab={activeTxnTab}
          voucherData={filteredVoucherData}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>
    </div>
  );
}
