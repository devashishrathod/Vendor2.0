/**
 * Grey "Before you continue" panel with short bullet points (06, 06r).
 * @param {{ items: string[] }} props
 */
export function BeforeContinuePanel({ items }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Before you continue</p>
      <ul className="mt-1.5 grid grid-cols-1 gap-1.5 text-xs text-gray-700 sm:grid-cols-3 sm:gap-2.5 dark:text-gray-300">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5">
            <span aria-hidden="true">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Left side of a verification footer: small uppercase label + summary.
 * @param {{ label: string, children: import('react').ReactNode }} props
 */
export function FooterSummary({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  );
}

