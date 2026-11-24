import { Check, Ellipsis } from "lucide-react";
import RemoteIcon from "../../components/ui/RemoteIcon";

/**
 * Numbered heading for a part of the category screen. The number turns into
 * a check once that part is answered.
 * @param {{
 *   id: string,
 *   number: number,
 *   title: string,
 *   hint?: import('react').ReactNode,
 *   done?: boolean,
 *   aside?: import('react').ReactNode,
 * }} props
 */
export function SectionHeading({ id, number, title, hint, done = false, aside }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={`mt-px grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold transition-colors ${
            done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
          aria-hidden="true"
        >
          {done ? <Check size={13} strokeWidth={3} /> : number}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {title} <span className="text-red-500">*</span>
          </h2>
          {hint && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
      </div>
      {aside}
    </div>
  );
}

/**
 * One category: icon on top, name below, a check in the corner when picked.
 * @param {{
 *   title: string,
 *   icon: import('react').ElementType,
 *   imageUrl?: string|null,
 *   selected: boolean,
 *   onSelect: () => void,
 * }} props
 */
export function CategoryTile({ title, icon, imageUrl, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group relative flex min-h-[104px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        selected
          ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10"
          : "bg-white ring-1 ring-gray-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-900/5 hover:ring-emerald-300 dark:bg-gray-900 dark:ring-gray-700 dark:hover:ring-emerald-500/50"
      }`}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl ring-1 transition-colors ${
          selected
            ? "bg-white text-emerald-600 ring-emerald-200 dark:bg-gray-900 dark:text-emerald-400 dark:ring-emerald-500/30"
            : "bg-gray-50 text-gray-500 ring-gray-100 group-hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:group-hover:text-emerald-400"
        }`}
      >
        <RemoteIcon src={imageUrl} fallback={icon} size={22} className="size-full p-1.5" />
      </span>
      <span
        className={`line-clamp-2 text-[13px] leading-snug ${
          selected ? "font-bold text-emerald-800 dark:text-emerald-300" : "font-semibold text-gray-700 dark:text-gray-200"
        }`}
      >
        {title}
      </span>
      {selected && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * The "More" tile that opens the rest of the categories.
 * @param {{ hiddenCount: number, onClick: () => void }} props
 */
export function MoreCategoriesTile({ hiddenCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[104px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-200 p-3 text-center text-gray-500 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5 dark:hover:text-emerald-300"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-gray-50 dark:bg-gray-800">
        <Ellipsis size={22} aria-hidden="true" />
      </span>
      <span className="text-[13px] font-semibold leading-snug">
        {hiddenCount > 0 ? `${hiddenCount} more` : "More"}
      </span>
    </button>
  );
}

/**
 * One sub-category as a checkbox row: icon, name, check box on the right.
 * @param {{
 *   title: string,
 *   icon: import('react').ElementType,
 *   imageUrl?: string|null,
 *   selected: boolean,
 *   onToggle: () => void,
 * }} props
 */
export function SubCategoryOption({ title, icon, imageUrl, selected, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        selected
          ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/10"
          : "bg-white ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-emerald-300 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800/60 dark:hover:ring-emerald-500/50"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ${
          selected
            ? "bg-white text-emerald-600 ring-emerald-200 dark:bg-gray-900 dark:text-emerald-400 dark:ring-emerald-500/30"
            : "bg-gray-50 text-gray-500 ring-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"
        }`}
      >
        <RemoteIcon src={imageUrl} fallback={icon} size={16} className="size-full p-1" />
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${
          selected ? "font-bold text-emerald-800 dark:text-emerald-300" : "font-semibold text-gray-700 dark:text-gray-200"
        }`}
      >
        {title}
      </span>
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-md transition-colors ${
          selected ? "bg-emerald-500 text-white" : "ring-2 ring-inset ring-gray-300 dark:ring-gray-600"
        }`}
        aria-hidden="true"
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}
