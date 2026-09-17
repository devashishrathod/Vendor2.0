import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OutletDetailsHeader from "../components/OutletDetailsHeader";
import OutletDetailsInfo from "../components/OutletDetailsInfo";
import TransactionSummaryPanel from "../components/TransactionSummaryPanel";
import EditOutletModal from "../components/EditOutletModal";
import EditLocationModal from "../components/EditLocationModal";
import { useOutletDetails } from "../hooks/useOutletDetails";

export default function OutletDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { outlet, brand, transactions, loading, error, reload } = useOutletDetails(id);
  const [editing, setEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const handleBack = () => navigate("/outlets");

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
            className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <OutletDetailsHeader outlet={outlet} brand={brand} onBack={handleBack} />
        <TransactionSummaryPanel transactions={transactions} />
        <OutletDetailsInfo
          outlet={outlet}
          brand={brand}
          onEdit={() => setEditing(true)}
          onEditLocation={() => setEditingLocation(true)}
        />
      </div>

      {editing && (
        <EditOutletModal
          outlet={outlet}
          onClose={() => setEditing(false)}
          onUpdated={() => {
            setEditing(false);
            reload();
          }}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          outlet={outlet}
          onClose={() => setEditingLocation(false)}
          onUpdated={() => {
            setEditingLocation(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
