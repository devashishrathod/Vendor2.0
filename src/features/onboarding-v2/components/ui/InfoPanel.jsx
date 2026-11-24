const TONES = {
  emerald: "bg-emerald-50 dark:bg-emerald-500/10",
  gray: "bg-gray-50 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700",
};

/**
 * Side panel for "why we ask" / "what this unlocks" content.
 * @param {{
 *   title: string,
 *   tone?: 'emerald' | 'gray',
 *   items?: { icon: import('react').ElementType, title: string, text: string }[],
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function InfoPanel({ title, tone = "gray", items = [], children }) {
  return (
    <div className={`flex flex-col gap-3 rounded-xl p-4 ${TONES[tone]}`}>
      <p className={`text-xs font-bold ${tone === "emerald" ? "text-emerald-800 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
        {title}
      </p>
      {items.map(({ icon: Icon, title: itemTitle, text }) => (
        <div key={itemTitle} className="flex gap-2.5">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200">{itemTitle}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">{text}</p>
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}
