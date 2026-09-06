// A big label that marks the start of one of the two top-level forms
// (Brand vs Outlet) so the two stay visually and structurally separate —
// an icon badge + title/subtitle, matching the onboarding step header
// pattern, so each group reads as its own distinct block at a glance.
export default function FormDivider({ eyebrow, title, subtitle, icon }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        {eyebrow && (
          <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
