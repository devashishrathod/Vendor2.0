import { useState, useEffect, useMemo, useCallback } from "react";
import RefundSummaryCards from "../components/RefundSummaryCards";
import SuccessToast from "@/components/common/SuccessToast";
import RefundOverview from "../components/RefundOverview";
import RefundDecisionModal from "../components/RefundDecisionModal";
import { fetchRefundOverview } from "../services/refundService";

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Same {from, to} "YYYY-MM-DD" range check as the Transactions page.
function isWithinRange(iso, { from, to }) {
  if (!iso) return false;
  const date = new Date(iso);
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59.999`)) return false;
  return true;
}

// ─── Refunds Page — sibling of Transactions.jsx, same layout ──────────────
// GET /refunds is scoped by the auth token (the Postman request sends no
// brandId), so no brand resolution is needed here.
export default function Refunds() {
  const [openFilter, setOpenFilter] = useState("open");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // { mode: "approve"|"reject", row } while the decision modal is open.
  const [decision, setDecision] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadRefunds = useCallback(
    () => fetchRefundOverview(openFilter === "open" ? { open: true } : {}),
    [openFilter]
  );

  useEffect(() => {
    let cancelled = false;
    loadRefunds()
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load refunds.");
        console.error("Failed to load refunds:", err.message);
      });
    return () => { cancelled = true; };
  }, [loadRefunds]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRefunds()
      .then((result) => {
        setRows(result.rows);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load refunds.");
        console.error("Failed to load refunds:", err.message);
      })
      .finally(() => setRefreshing(false));
  }, [loadRefunds]);

  const handleDecide = useCallback((mode, row) => setDecision({ mode, row }), []);
  const closeDecision = useCallback(() => setDecision(null), []);
  const clearSuccess = useCallback(() => setSuccessMsg(""), []);

  // After approve/reject, re-fetch so status/canDecide come from the backend.
  const handleDecisionDone = useCallback((message) => {
    setDecision(null);
    setSuccessMsg(message);
    handleRefresh();
  }, [handleRefresh]);

  const filteredRows = useMemo(
    () =>
      !dateRange.from && !dateRange.to
        ? rows
        : rows.filter((row) => isWithinRange(row.raw?.createdAt, dateRange)),
    [rows, dateRange]
  );

  const stats = useMemo(() => {
    const requested = filteredRows.reduce((acc, r) => acc + Number(r.raw?.requestedAmount || 0), 0);
    const open = filteredRows.filter((r) => r.isOpen).length;
    return {
      requestedAmount: formatINR(requested),
      totalCount: filteredRows.length,
      openCount: open,
      closedCount: filteredRows.length - open,
    };
  }, [filteredRows]);

  return (
    <div className="min-h-screen dark:bg-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Refund's Overview</h1>
          <p className="text-xs text-gray-400 mt-1">
            Track every refund request raised against your vouchers.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2.5 text-center">
            {error}
          </p>
        )}

        <RefundSummaryCards
          {...stats}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <RefundOverview
          rows={filteredRows}
          openFilter={openFilter}
          onOpenFilterChange={setOpenFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onDecide={handleDecide}
        />
      </div>

      {decision && (
        <RefundDecisionModal
          mode={decision.mode}
          row={decision.row}
          onClose={closeDecision}
          onDone={handleDecisionDone}
        />
      )}

      <SuccessToast message={successMsg} onDismiss={clearSuccess} />
    </div>
  );
}
