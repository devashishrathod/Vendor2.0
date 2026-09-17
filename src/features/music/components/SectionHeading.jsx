export default function SectionHeading({ title, subtitle, viewAllLabel = "View All", expanded, onToggleViewAll }) {
  return (
    <div className="flex items-start justify-between mb-3 gap-3">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {onToggleViewAll && (
        <button
          type="button"
          onClick={onToggleViewAll}
          className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap mt-0.5"
        >
          {expanded ? "Show Less" : viewAllLabel} →
        </button>
      )}
    </div>
  );
}
