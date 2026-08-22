// A big label that marks the start of one of the two top-level forms
// (Brand vs Outlet) so the two stay visually and structurally separate.
export default function FormDivider({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6 mt-12 first:mt-0">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase">{eyebrow}</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
