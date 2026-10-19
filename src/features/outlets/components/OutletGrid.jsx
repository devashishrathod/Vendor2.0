import OutletCard from "./OutletCard";

export default function OutletGrid({
  outlets = [],
  selectedIds = [],
  onSelect,
  onToggleStatus,
  onExploreDetails,
  onEdit,
  loading,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[440px] rounded-3xl bg-white/60 dark:bg-gray-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!outlets.length) {
    return <div className="text-center py-16 text-sm text-gray-400">No outlets match your search or filters.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {outlets.map((outlet) => (
        <OutletCard
          key={outlet.id}
          outlet={outlet}
          selected={selectedIds.includes(outlet.id)}
          onSelect={onSelect}
          onToggleStatus={onToggleStatus}
          onExploreDetails={onExploreDetails}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}