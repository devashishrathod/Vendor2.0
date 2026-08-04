import { useNavigate, useParams } from "react-router-dom";
import OutletDetailsHeader from "../components/OutletDetailsHeader";
import TransactionSummaryPanel from "../components/TransactionSummaryPanel";
import { useOutletDetails } from "../hooks/useOutletDetails";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";

export default function OutletDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { outlet, transactions, loading, error } = useOutletDetails(id);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-16 rounded-2xl bg-gray-100 animate-pulse mb-6" />
          <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !outlet) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">{error || "Outlet not found."}</p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d5e]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
  <div>
    <DashboardHeader/>
      <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <OutletDetailsHeader outlet={outlet} onBack={handleBack} />
        <TransactionSummaryPanel transactions={transactions} />
      </div>
    </div>
  </div>
  );
}
