import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OutletsToolbar from "../components/OutletsToolbar";
import OutletGrid from "../components/OutletGrid";
import Pagination from "../components/Pagination";
import AddOutletModal from "../components/AddOutletModal";
import { useOutlets } from "../hooks/useOutlets";
import { useOutletFilters } from "../hooks/useOutletFilters";
import { exportOutlets } from "../services/outletService";
import { PAGE_SIZE } from "../constants/outletConstants";
import { MOCK_OUTLETS } from "../constants/mockOutlets"; // ← added

export default function OutletsPage() {
  const { search, setSearch, filters, toggleFilter, clearFilters, activeFilterCount, page, setPage } =
    useOutletFilters();
  const { outlets, total, loading, toggleStatus, reload } = useOutlets({ search, filters, page });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // 🔧 TEMP: useOutlets abhi galat/duplicate data de raha hai (hook me bug
  // hai), isliye mock data force kar rahe hain. useOutlets fix hone ke
  // baad ye line hata ke neeche "outlets" wapas use karna.
  const displayOutlets = MOCK_OUTLETS;
  const displayTotal = MOCK_OUTLETS.length;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleExploreDetails = (outlet) => {
    navigate(`/outlets/${outlet.id}`);
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Own Outlet's &amp; Franchise Outlet's information</h1>

          <OutletsToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            onExport={exportOutlets}
            onAddOutlet={() => setShowAddModal(true)}
          />

          <OutletGrid
            outlets={displayOutlets}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onToggleStatus={toggleStatus}
            onExploreDetails={handleExploreDetails}
            loading={false}
          />

          <Pagination page={page} pageSize={PAGE_SIZE} total={displayTotal} onPageChange={setPage} />
        </div>

        {showAddModal && <AddOutletModal onClose={() => setShowAddModal(false)} onCreated={() => reload()} />}
      </div>
    </div>
  );
}