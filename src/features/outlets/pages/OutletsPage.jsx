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
  const {
    search, setSearch,
    filters, toggleFilter, clearFilterGroup,
    dateRange, setDateRange, clearDateRange,
    sortBy, setSortBy, sortOrder, setSortOrder,
    page, setPage,
  } = useOutletFilters();
  // ⚠️ FIXED: "Export Data" used to call outletService.exportOutlets, which
  // exported hardcoded MOCK_OUTLETS — completely disconnected from what's
  // actually on screen. useOutlets' exportOutlets fetches the real, full
  // subBrand list and applies the SAME search/filter/sort logic as the
  // visible grid, so the export always matches what's currently filtered —
  // not just the current page, and not stale mock rows.
  const { outlets, total, allCount, loading, error, clearError, toggleStatus, reload, exportOutlets, exporting } = useOutlets({
    search,
    filters,
    dateRange,
    sortBy,
    sortOrder,
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
      <div className="min-h-screen dark:bg-gray-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Own Outlet's &amp; Franchise Outlet's information</h1>

          <OutletsToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onToggleFilter={toggleFilter}
            onClearFilterGroup={clearFilterGroup}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onClearDateRange={clearDateRange}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onExport={exportOutlets}
            exporting={exporting}
            onAddOutlet={() => setShowAddModal(true)}
          />

          {error && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30" role="alert">
              <span>{error}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold underline">
                Dismiss
              </button>
            </div>
          )}

          <OutletGrid
            outlets={outlets}
            brandId={brand?._id}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onToggleStatus={toggleStatus}
            onExploreDetails={handleExploreDetails}
            onEdit={setEditingOutlet}
            onChanged={reload}
            loading={loading}
          />

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>

        {showAddModal && (
          <AddOutletModal brand={brand} existingCount={allCount} onClose={() => setShowAddModal(false)} onChanged={reload} />
        )}

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