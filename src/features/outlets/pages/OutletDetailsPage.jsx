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
  const { outlet, brand, transactions, transactionsError, loading, error, reload } = useOutletDetails(id);
  const [editing, setEditing] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const handleBack = () => navigate("/outlets");

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="h-6 w-56 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse mb-2" />
          <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !outlet) {
    return (
      <div className="min-h-screen dark:bg-gray-900 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || "Outlet not found."}</p>
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
    <div className="min-h-screen dark:bg-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        {/* Same page heading style as OutletsPage */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          <button onClick={handleBack} className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Outlets
          </button>
          <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
          Outlet Details
        </h1>

        <OutletDetailsHeader outlet={outlet} brand={brand} onBack={handleBack} />

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Summary</h2>
          <TransactionSummaryPanel transactions={transactions} error={transactionsError} />
        </div>
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
