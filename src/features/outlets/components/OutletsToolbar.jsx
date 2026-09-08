import { useEffect, useRef, useState } from "react";
import { OUTLET_TYPE_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from "../constants/outletConstants";

// Small dropdown shell shared by Outlet Type / Status / Sort / Date Range —
// each used to live crammed into one combined "Filter" panel; now every
// one of them is its own standalone button + panel, closing on an outside
// click same as the Analytics menu already did.
function DropdownButton({ label, icon, badgeCount, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
      >
        {icon}
        {label}
        {badgeCount > 0 && (
          <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-xs rounded-full">
            {badgeCount}
          </span>
        )}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const FilterIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SortIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
  </svg>
);

const CalendarIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function OutletsToolbar({
  search,
  onSearchChange,
  filters,
  onToggleFilter,
  onClearFilterGroup,
  dateRange,
  onDateRangeChange,
  onClearDateRange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onExport,
  exporting,
  onAddOutlet,
}) {
  const hasDateRange = !!(dateRange?.from || dateRange?.to);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Outlet Type — its own dropdown (used to be grouped with Status) */}
      <DropdownButton label="Outlet Type" icon={FilterIcon} badgeCount={filters.type.length}>
        {(close) => (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Outlet Type</p>
            <div className="space-y-2">
              {OUTLET_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.type.includes(opt.value)}
                    onChange={() => onToggleFilter("type", opt.value)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => onClearFilterGroup("type")} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                Clear
              </button>
              <button onClick={close} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Done
              </button>
            </div>
          </>
        )}
      </DropdownButton>

      {/* Status — its own dropdown */}
      <DropdownButton label="Status" icon={FilterIcon} badgeCount={filters.status.length}>
        {(close) => (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</p>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(opt.value)}
                    onChange={() => onToggleFilter("status", opt.value)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => onClearFilterGroup("status")} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                Clear
              </button>
              <button onClick={close} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Done
              </button>
            </div>
          </>
        )}
      </DropdownButton>

      {/* Sort — sort-by dropdown, followed by Ascending/Descending order */}
      <DropdownButton label="Sort" icon={SortIcon} badgeCount={0}>
        {(close) => (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sort By</p>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4 mb-2">Order</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="outlet-sort-order"
                  checked={sortOrder === "asc"}
                  onChange={() => onSortOrderChange("asc")}
                  className="w-4 h-4 accent-emerald-600"
                />
                Ascending
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="outlet-sort-order"
                  checked={sortOrder === "desc"}
                  onChange={() => onSortOrderChange("desc")}
                  className="w-4 h-4 accent-emerald-600"
                />
                Descending
              </label>
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <button onClick={close} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Done
              </button>
            </div>
          </>
        )}
      </DropdownButton>

      {/* Custom Date Range — filters on the outlet's Joined Date */}
      <DropdownButton label="Date Range" icon={CalendarIcon} badgeCount={hasDateRange ? 1 : 0}>
        {(close) => (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Joined Date</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button onClick={onClearDateRange} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                Clear
              </button>
              <button onClick={close} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Done
              </button>
            </div>
          </>
        )}
      </DropdownButton>

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
