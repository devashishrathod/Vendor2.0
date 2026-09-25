// src/pages/voucher/VoucherDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useVoucherDetails from "../../hooks/voucher/useVoucherDetails";
import {
  VoucherTabs,
  VoucherAnalysisStats,
  VoucherOutletUsageTable,
  VoucherRevenueChart,
  VoucherCustomerFlowChart,
  VoucherStorePerformance,
  VoucherDetailsInfo,
  VoucherTransactionInfo,
} from "../../components/voucher";
import { useOnboardingStore } from "../../../onboarding/store/onboardingStore";
import { useAuthStore } from "../../../onboarding/store/authStore";
import useBrandData from "../../../brand/hooks/useBrandData";
import { fetchVoucherTransactionsByVoucherId } from "../../../transaction/services/transactionService";

// Confirmed real values seen so far: DRAFT, APPROVED — REJECTED/
// UNDER_REVIEW inferred from the rejectedAt/rejectedBy and submittedAt/
// reviewedAt fields the API also returns. Anything else falls back to the
// plain gray badge below rather than guessing further enum values.
const STATUS_BADGE = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  UNDER_REVIEW: "bg-amber-50 text-amber-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  PUBLISHED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-rose-50 text-rose-500",
};

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VoucherDetails() {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  // CONFIRMED real shape (GET /vouchers/get/:voucherId): `details` is
  // { voucher, brand, currentVersion, publishedVersion, versions,
  // versionCount, stats } — three separate documents, not one flat
  // object. voucherDoc/version below are the two this page actually reads.
  const { voucher: details, isLoading, error } = useVoucherDetails(voucherId);
  const [activeTab, setActiveTab] = useState("Analysis Report");

  const voucherDoc = details?.voucher;
  const version = details?.currentVersion;

  // The real response already carries the brand (details.brand) — only
  // fall back to the session's own brandId if that's somehow missing.
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = details?.brand?._id || onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  // GET /voucher-claims/payments?voucherId=&brandId= — real payments for
  // just this voucher, lazily fetched once the Transaction Information tab
  // is actually opened.
  const [txnData, setTxnData] = useState(null);
  const [txnError, setTxnError] = useState(null);
  useEffect(() => {
    if (activeTab !== "Transaction Information" || !voucherDoc?._id || !resolvedBrandId) return;
    let cancelled = false;

    function resetTxnError() {
      setTxnError(null);
    }
    resetTxnError();

    fetchVoucherTransactionsByVoucherId(voucherDoc._id, { brandId: resolvedBrandId })
      .then((result) => { if (!cancelled) setTxnData(result); })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load voucher transactions:", err.message);
        setTxnError(err.message || "Failed to load transactions for this voucher.");
      });
    return () => { cancelled = true; };
  }, [activeTab, voucherDoc?._id, resolvedBrandId]);

  if (isLoading) {
    return <p className="px-4 py-10 text-center text-gray-400">Loading voucher details…</p>;
  }

  if (error || !voucherDoc) {
    return <p className="px-4 py-10 text-center text-rose-500">{error || "Voucher not found."}</p>;
  }

  return (
    <div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/vouchers")}
              className="mt-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{voucherDoc.name}</h1>
              <p className="text-xs text-gray-400">Created Date: {formatDate(voucherDoc.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[voucherDoc.status] || "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
            >
              {voucherDoc.status}
            </span>
            <button
              onClick={() => navigate(`/vouchers/${voucherDoc._id}/edit`)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Edit Voucher
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center  gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{version?.versionCode}</p>

          <VoucherTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-5 space-y-6">
          {activeTab === "Analysis Report" && (
            <>
              {/* CONFIRMED real data: details.stats.revenue (from GET
                  /vouchers/get/:voucherId). VoucherAnalysisStats' 5 cards
                  are aggregate totals, so they map cleanly onto it —
                  billAmount→Total Bill Value, offerDiscount→Total Discount
                  Amount, promoDiscount→Additional Discount (a separate
                  promo-code discount, distinct from the offer's own),
                  customerPaid→Paid Amount, vendorPayable→Over All Earning
                  (what this vendor actually gets paid out). */}
              <VoucherAnalysisStats
                analysis={{
                  overAllEarning: details?.stats?.revenue?.vendorPayable,
                  totalBillValue: details?.stats?.revenue?.billAmount,
                  totalDiscountAmount: details?.stats?.revenue?.offerDiscount,
                  additionalDiscount: details?.stats?.revenue?.promoDiscount,
                  paidAmount: details?.stats?.revenue?.customerPaid,
                }}
              />
              {/* ⚠️ NOT WIRED: the other 4 need a weekly time-series or a
                  per-outlet revenue breakdown — neither exists anywhere in
                  this response (only the aggregate totals above, plus
                  details.stats.claims — total/pending/paid/redeemed/failed/
                  cancelled/expired/refunded counts — which has no matching
                  component here yet). Left as empty/placeholder (they never
                  crash on undefined) rather than fabricating numbers. */}
              <VoucherOutletUsageTable title={voucherDoc.name} outletUsage={undefined} />
              <VoucherRevenueChart revenueWeekly={undefined} />
              <VoucherCustomerFlowChart customerFlowWeekly={undefined} />
              <VoucherStorePerformance storePerformance={undefined} />
            </>
          )}

          {activeTab === "Voucher Details" && <VoucherDetailsInfo details={details} />}

          {activeTab === "Transaction Information" && (
            <>
              {txnError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">
                  {txnError}
                </p>
              )}
              <VoucherTransactionInfo
                voucherTitle={voucherDoc.name}
                summary={txnData?.summary}
                transactions={txnData?.rows || []}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}