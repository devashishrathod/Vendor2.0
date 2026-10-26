/**
 * Selectable card used for single-choice questions (registration status,
 * business type, category tiles). A real <button> with aria-pressed so it
 * works with keyboard and screen readers.
 * @param {{
 *   selected: boolean,
 *   onSelect: () => void,
 *   title: string,
 *   description?: string,
 *   icon?: import('react').ElementType,
 *   badge?: import('react').ReactNode,
 *   variant?: 'card' | 'tile',
 *   showIndicator?: boolean,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon: Icon,
  badge,
  variant = "card",
  showIndicator = true,
  children,
}) {
  const isTile = variant === "tile";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex h-full w-full cursor-pointer flex-col text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        isTile ? "min-h-[88px] gap-2 rounded-xl p-3.5" : "gap-3 rounded-2xl p-4 sm:p-[18px]"
      } ${
        selected
          ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10"
          : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-gray-900 dark:ring-gray-700 dark:hover:ring-gray-600"
      }`}
    >
      <span className="flex w-full items-start gap-3">
        {Icon && (
          <span
            className={`grid shrink-0 place-items-center ${
              isTile ? "" : "size-9 rounded-[10px]"
            } ${
              selected
                ? `text-emerald-600 ${isTile ? "" : "bg-emerald-100 dark:bg-emerald-500/20"}`
                : `text-gray-400 ${isTile ? "" : "bg-gray-100 dark:bg-gray-800"}`
            }`}
          >
            <Icon size={isTile ? 20 : 18} strokeWidth={1.8} aria-hidden="true" />
          </span>
        )}
        {!isTile && (
          <span className="min-w-0 flex-1">
            <span className={`block text-[15px] font-extrabold ${selected ? "text-emerald-800 dark:text-emerald-300" : "text-gray-700 dark:text-gray-200"}`}>
              {title}
            </span>
            {description && (
              <span className={`mt-1 block text-xs leading-snug ${selected ? "text-emerald-700 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}>
                {description}
              </span>
            )}
          </span>
        )}
        {showIndicator && !isTile && (
          <span
            className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full ${
              selected ? "bg-emerald-500" : "ring-2 ring-inset ring-gray-300 dark:ring-gray-600"
            }`}
            aria-hidden="true"
          >
            {selected && <span className="size-1.5 rounded-full bg-white" />}
          </span>
        )}
      </span>
      {isTile && (
        <span className={`text-[13px] leading-snug ${selected ? "font-bold text-emerald-800 dark:text-emerald-300" : "font-semibold text-gray-700 dark:text-gray-200"}`}>
          {title}
        </span>
      )}
      {badge}
      {children}
    </button>
  );
}
