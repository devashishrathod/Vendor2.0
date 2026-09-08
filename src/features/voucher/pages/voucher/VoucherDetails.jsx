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
  DRAFT: "bg-gray-100 text-gray-600",
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
  const { voucher, isLoading, error } = useVoucherDetails(voucherId);
  const [activeTab, setActiveTab] = useState("Analysis Report");

  // Same brandId-resolution pattern as useVoucher.js / VoucherDetailsInfo.jsx.
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = voucher?.brandId || onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  // GET /voucher-claims/payments?voucherId=&brandId= — real payments for
  // just this voucher, lazily fetched once the Transaction Information tab
  // is actually opened.
  const [txnData, setTxnData] = useState(null);
  useEffect(() => {
    if (activeTab !== "Transaction Information" || !voucher?.voucherId || !resolvedBrandId) return;
    let cancelled = false;
    fetchVoucherTransactionsByVoucherId(voucher.voucherId, { brandId: resolvedBrandId })
      .then((result) => { if (!cancelled) setTxnData(result); })
      .catch((err) => console.error("Failed to load voucher transactions:", err.message));
    return () => { cancelled = true; };
  }, [activeTab, voucher?.voucherId, resolvedBrandId]);

  if (isLoading) {
    return <p className="px-4 py-10 text-center text-gray-400">Loading voucher details…</p>;
  }

  if (error || !voucher) {
    return <p className="px-4 py-10 text-center text-rose-500">{error || "Voucher not found."}</p>;
  }

  return (
    <div>
 
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{voucher.name}</h1>
              <p className="text-xs text-gray-400">Created Date: {formatDate(voucher.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[voucher.status] || "bg-gray-100 text-gray-500"
                }`}
            >
              {voucher.status}
            </span>
            <button
              onClick={() => navigate(`/vouchers/${voucher.voucherId}/edit`)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Edit Voucher
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center  gap-3">
          <p className="text-xs text-black">{voucher.versionCode}</p>

          <VoucherTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-5 space-y-6">
          {activeTab === "Analysis Report" && (
            <>
              {/* <VoucherKeySummary keySummary={voucher.keySummary} /> */}
              <VoucherAnalysisStats analysis={voucher.analysis} />
              <VoucherOutletUsageTable title={voucher.title} outletUsage={voucher.outletUsage} />
              <VoucherRevenueChart revenueWeekly={voucher.revenueWeekly} />
              <VoucherCustomerFlowChart customerFlowWeekly={voucher.customerFlowWeekly} />
              <VoucherStorePerformance storePerformance={voucher.storePerformance} />
            </>
          )}

          {activeTab === "Voucher Details" && <VoucherDetailsInfo voucher={voucher} />}

          {activeTab === "Transaction Information" && (
            <VoucherTransactionInfo
              voucherTitle={voucher.name}
              summary={txnData?.summary}
              transactions={txnData?.rows || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}