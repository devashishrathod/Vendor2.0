import { ChevronRight } from 'lucide-react';

/**
 * One icon+label+value tile — the base unit InfoGrid/BillingInfo/etc. lay
 * out in a grid. `link` (optional) renders a small "View X →" action below
 * the value, e.g. Invoice Information's "View Invoice"/"Raise Query" rows.
 */
export function InfoTile({ icon, iconBg = 'bg-blue-50', iconText = 'text-blue-500', label, value, valueNode, link, className = '' }) {
  return (
    <div className={`flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 ${className}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconText}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        {valueNode ?? <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value ?? '—'}</p>}
        {link && (
          <button
            onClick={link.onClick}
            className="text-xs font-semibold text-emerald-600 hover:underline mt-1 flex items-center gap-0.5"
          >
            {link.text} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Responsive grid of InfoTiles. `items` is an array of InfoTile props;
 * pass `wide: true` on an item to have it span 2 columns (e.g. a long
 * address). `cols` picks the grid's max column count — 2, 3, or 4 — as a
 * literal Tailwind class so the JIT scanner can find it (no dynamic
 * `grid-cols-${n}` strings).
 */
export function InfoGrid({ items, cols = 4 }) {
  const gridClass =
    cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-3`}>
      {items.map((item, idx) => (
        <InfoTile key={idx} {...item} className={item.wide ? 'sm:col-span-2' : ''} />
      ))}
    </div>
  );
}

export function InfoSection({ icon, title, subtitle, action, children }) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">{title}</h4>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
