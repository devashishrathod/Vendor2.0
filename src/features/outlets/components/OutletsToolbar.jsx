import { useEffect, useRef, useState } from "react";
import FilterPanel from "./FilterPanel";
import AnalyticsMenu from "./AnalyticsMenu";

export default function OutletsToolbar({
  search,
  onSearchChange,
  filters,
  onToggleFilter,
  onClearFilters,
  activeFilterCount,
  onExport,
  exporting,
  onAddOutlet,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const filterRef = useRef();
  const analyticsRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (analyticsRef.current && !analyticsRef.current.contains(e.target)) setAnalyticsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative" ref={analyticsRef}>
        <button
          onClick={() => setAnalyticsOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Analytics Report
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {analyticsOpen && <AnalyticsMenu onClose={() => setAnalyticsOpen(false)} />}
      </div>

      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {filterOpen && (
          <FilterPanel
            filters={filters}
            onToggleFilter={onToggleFilter}
            onClear={onClearFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      <div className="flex-1 min-w-[220px] relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.4 4.4a7.5 7.5 0 0012.25 12.25z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Here - Strore Id, Active , Not Active."
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-700"
        />
      </div>

      <button
        onClick={onExport}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2-9H8a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V9l-6-6z" />
          </svg>
        )}
        {exporting ? "Exporting…" : "Export Data"}
      </button>

      <button
        onClick={onAddOutlet}
        className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-100"
      >
        Add Outlet's
      </button>
    </div>
  );
}
