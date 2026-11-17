import { Check, Eye, ImageIcon, Store } from "lucide-react";

const DESCRIPTION_STRONG_LENGTH = 50;

/**
 * Live "how customers see you" card beside Brand Details: cover, logo,
 * brand name, category · sub-category and description, plus a small
 * checklist of what makes the listing stand out.
 * @param {{
 *   coverUrl?: string|null, logoUrl?: string|null, brandName?: string,
 *   categoryName?: string, subCategoryName?: string, description?: string,
 * }} props
 */
export default function CustomerPreview({ coverUrl, logoUrl, brandName, categoryName, subCategoryName, description }) {
  const descriptionLength = description?.trim().length || 0;
  const checks = [
    { label: "Logo", done: Boolean(logoUrl) },
    { label: "Cover image", done: Boolean(coverUrl) },
    { label: `Description (${DESCRIPTION_STRONG_LENGTH}+ characters)`, done: descriptionLength >= DESCRIPTION_STRONG_LENGTH },
  ];
  const doneCount = checks.filter((c) => c.done).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
        <Eye size={13} aria-hidden="true" />
        Customer preview
      </p>

      {/* The listing card as customers see it */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E9E2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.12)] dark:border-gray-700 dark:bg-gray-800">
        <div className="relative aspect-[16/7] bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700/70 dark:text-emerald-300/70">
              <ImageIcon size={14} aria-hidden="true" />
              Cover image
            </span>
          )}
          {/* Logo overlaps the cover's bottom edge; z-10 keeps it above the image. */}
          <div className="absolute -bottom-6 left-4 z-10 grid size-14 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-md ring-[3px] ring-white dark:bg-gray-700 dark:ring-gray-800">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <Store size={20} className="text-gray-400" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="px-4 pb-4 pt-8">
          <p className={`truncate text-[15px] font-extrabold capitalize ${brandName ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>
            {brandName || "Your brand name"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categoryName ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {categoryName}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-400 dark:bg-gray-700">Category</span>
            )}
            {subCategoryName && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {subCategoryName}
              </span>
            )}
          </div>
          <p
            className={`mt-3 line-clamp-3 border-t border-gray-100 pt-3 text-[13px] leading-relaxed dark:border-gray-700 ${
              description ? "text-gray-700 dark:text-gray-300" : "italic text-gray-400"
            }`}
          >
            {description || "Your description shows here."}
          </p>
        </div>
      </div>

      {/* What makes it stand out — ticks as the vendor fills things in */}
      <div className="rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-inset ring-[#E4E9E2] dark:bg-gray-800/60 dark:ring-gray-700">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200">Make your listing stand out</p>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            {doneCount}/{checks.length}
          </span>
        </div>
        <ul className="mt-2 flex flex-col gap-1.5">
          {checks.map((check) => (
            <li
              key={check.label}
              className={`flex items-center gap-2 text-[12px] ${check.done ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}
            >
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full ${
                  check.done ? "bg-emerald-500 text-white" : "ring-[1.5px] ring-inset ring-gray-300 dark:ring-gray-600"
                }`}
                aria-hidden="true"
              >
                {check.done && <Check size={10} strokeWidth={3.5} />}
              </span>
              {check.label}
              <span className="sr-only">{check.done ? "(done)" : "(not yet)"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
