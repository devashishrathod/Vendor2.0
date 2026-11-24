import { Lock, Tag } from "lucide-react";

/**
 * CategoryInfoSection
 * category and subCategory are separate top-level fields on the brand
 * object in the real API (brand.category, brand.subCategory) — each a real
 * category document: { name, description, image, isActive, ... }. `image`
 * is a real per-category picture (used as the card's decorative art
 * instead of a generic icon), `isActive` drives the "Verified" pill below
 * the name. `item.tags` (small pill chips, e.g. "Hotels"/"Premium Stay") is
 * rendered only when the document actually carries that field — it isn't
 * confirmed on every category yet, so this never invents chips that aren't
 * really there.
 */
function CategoryCard({ label, item, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${accent.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${accent.label}`}>{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{item?.name || "—"}</p>
          {/* {item?.isActive && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={12} />
              Verified
            </span>
          )} */}
          {item?.description && (
            <p className="mt-3 max-w-[75%] text-xs leading-relaxed text-gray-500">{item.description}</p>
          )}
          {Array.isArray(item?.tags) && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {item?.image && (
          <img
            src={item.image}
            alt=""
            className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Category + every sub-category of the brand (`subCategories[]` — a brand
 * has one category and several subcategories in v2). Read-only after
 * approval: changes go through support (guide §8, 409 LEGAL_FIELD_LOCKED).
 */
const CategoryInfoSection = ({ category, subCategories = [] }) => {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Tag className="w-4 h-4 text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Business Type &amp; Category</h2>
          <p className="text-xs text-gray-400 mt-0.5">This helps customers find your business on Trydood.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          <Lock size={11} aria-hidden="true" />
          Changes go through support
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryCard label="Main Category" item={category} accent={{ bg: "bg-emerald-50", label: "text-emerald-600" }} />
        {subCategories.length === 0 && (
          <CategoryCard label="Sub - Category" item={null} accent={{ bg: "bg-amber-50", label: "text-amber-600" }} />
        )}
        {subCategories.map((sub) => (
          <CategoryCard key={sub._id ?? sub.name} label="Sub - Category" item={sub} accent={{ bg: "bg-amber-50", label: "text-amber-600" }} />
        ))}
      </div>
    </section>
  );
};

export default CategoryInfoSection;
