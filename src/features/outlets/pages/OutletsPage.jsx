import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OutletsToolbar from "../components/OutletsToolbar";
import OutletGrid from "../components/OutletGrid";
import Pagination from "../components/Pagination";
import AddOutletModal from "../components/AddOutletModal";
import EditOutletModal from "../components/EditOutletModal";
import { useOutlets } from "../hooks/useOutlets";
import { useOutletFilters } from "../hooks/useOutletFilters";
import { useBrand } from "../../../hooks/useBrand"; // ← same path as AddOutletModal — adjust if needed
import { PAGE_SIZE } from "../constants/outletConstants";

export default function OutletsPage() {
  const { brand } = useBrand();
  const { search, setSearch, filters, toggleFilter, clearFilters, activeFilterCount, page, setPage } =
    useOutletFilters();
  // ⚠️ FIXED: "Export Data" used to call outletService.exportOutlets, which
  // exported hardcoded MOCK_OUTLETS — completely disconnected from what's
  // actually on screen. useOutlets' exportOutlets fetches the real, full
  // subBrand list and applies the SAME search/filter logic as the visible
  // grid, so the export always matches what's currently filtered — not just
  // the current page, and not stale mock rows.
  const { outlets, total, loading, toggleStatus, reload, exportOutlets, exporting } = useOutlets({
    search,
    filters,
    page,
    brandId: brand?._id,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const navigate = useNavigate();

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
            exporting={exporting}
            onAddOutlet={() => setShowAddModal(true)}
          />

          <OutletGrid
            outlets={outlets}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onToggleStatus={toggleStatus}
            onExploreDetails={handleExploreDetails}
            onEdit={setEditingOutlet}
            loading={loading}
          />

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>

        {showAddModal && <AddOutletModal onClose={() => setShowAddModal(false)} onCreated={() => reload()} />}

        {editingOutlet && (
          <EditOutletModal
            outlet={editingOutlet}
            onClose={() => setEditingOutlet(null)}
            onUpdated={() => {
              setEditingOutlet(null);
              reload();
            }}
          />
        )}
      </div>
    </div>
  );
}