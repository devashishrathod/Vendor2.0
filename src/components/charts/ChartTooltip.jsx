/**
 * Shared Recharts tooltip card (light + dark), used by every chart in
 * components/charts. `formatValue` formats each series value.
 */
export default function ChartTooltip({ active, payload, label, formatValue = (v) => v, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const heading = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 px-3 py-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      {heading && <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{heading}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color || p.payload?.color }} />
          {p.name && <span className="text-gray-400">{p.name}:</span>}
          <span className="font-semibold">{formatValue(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
}
