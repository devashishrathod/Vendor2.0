import { useMemo, useState } from "react";

const DEFAULT_DATE_RANGE = { from: "", to: "" };

export function useOutletFilters() {
  const [search, setSearchState] = useState("");
  const [filters, setFilters] = useState({ status: [], type: [] });
  const [dateRange, setDateRangeState] = useState(DEFAULT_DATE_RANGE);
  const [sortBy, setSortByState] = useState("joinedDate");
  const [sortOrder, setSortOrderState] = useState("desc");
  const [page, setPage] = useState(1);

  const activeFilterCount = useMemo(
    () => filters.status.length + filters.type.length + (dateRange.from || dateRange.to ? 1 : 0),
    [filters, dateRange]
  );

  const setSearch = (value) => {
    setPage(1);
    setSearchState(value);
  };

  const toggleFilter = (group, value) => {
    setPage(1);
    setFilters((prev) => {
      const current = prev[group] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [group]: next };
    });
  };

  const clearFilterGroup = (group) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [group]: [] }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ status: [], type: [] });
  };

  const setDateRange = (range) => {
    setPage(1);
    setDateRangeState(range);
  };

  const clearDateRange = () => {
    setPage(1);
    setDateRangeState(DEFAULT_DATE_RANGE);
  };

  const setSortBy = (value) => {
    setPage(1);
    setSortByState(value);
  };

  const setSortOrder = (value) => {
    setPage(1);
    setSortOrderState(value);
  };

  return {
    search,
    setSearch,
    filters,
    toggleFilter,
    clearFilterGroup,
    clearFilters,
    dateRange,
    setDateRange,
    clearDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    activeFilterCount,
    page,
    setPage,
  };
}
