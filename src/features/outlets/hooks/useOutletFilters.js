import { useMemo, useState } from "react";

export function useOutletFilters() {
  const [search, setSearchState] = useState("");
  const [filters, setFilters] = useState({ status: [], type: [] });
  const [page, setPage] = useState(1);

  const activeFilterCount = useMemo(() => filters.status.length + filters.type.length, [filters]);

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

  const clearFilters = () => {
    setPage(1);
    setFilters({ status: [], type: [] });
  };

  return { search, setSearch, filters, toggleFilter, clearFilters, activeFilterCount, page, setPage };
}
