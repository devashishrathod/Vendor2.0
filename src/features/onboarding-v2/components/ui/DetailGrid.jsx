const LG_COLUMNS = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

/**
 * Read-only tiles for verified details (PAN / GST / bank review). A missing
 * value shows "—" until the verification API fills it.
 * @param {{
 *   items: { label: string, value?: string|null, wide?: boolean, tone?: 'success' }[],
 *   columns?: 3 | 4,
 * }} props
 */
export default function DetailGrid({ items, columns = 3 }) {
  return (
    <dl className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 ${LG_COLUMNS[columns]}`}>
      {items.map((item) => {
        const success = item.tone === "success";
        return (
          <div
            key={item.label}
            className={`min-w-0 rounded-xl p-3 ${item.wide ? "sm:col-span-full" : ""} ${
              success
                ? "bg-emerald-50 dark:bg-emerald-500/10"
                : "bg-gray-50 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700"
            }`}
          >
            <dt className={`text-xs ${success ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-medium text-gray-500 dark:text-gray-400"}`}>
              {item.label}
            </dt>
            <dd
              className={`mt-1.5 break-words text-[13.5px] font-bold ${success ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"}`}
            >
              {item.value || <span className="font-semibold text-gray-400">—</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
