import { Tag, CheckCircle2 } from "lucide-react";

/**
 * CategoryInfoSection
 * category and subCategory are separate top-level fields on the brand
 * object in the real API (brand.category, brand.subCategory) — each a real
 * category document: { name, description, image, isActive, ... }. `image`
 * is a real per-category picture (used as the card's decorative art
 * instead of a generic icon), `isActive` drives the "Verified" pill below
 * the name.
 */
function CategoryCard({ label, item, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}>
      {item?.image && (
        <img
          src={item.image}
          alt=""
          className="absolute -right-2 -bottom-2 h-24 w-24 rounded-2xl object-cover opacity-90"
        />
      )}
      <p className="text-xs font-medium text-gray-500 relative">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 relative">{item?.name || "—"}</p>
      {item?.description && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 relative">
          <CheckCircle2 size={12} />
          Verified
        </span>
      )}
    </div>
  );
}

const CategoryInfoSection = ({ category, subCategory }) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <Tag className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">Business Type</h2>
          <p className="text-xs text-gray-400 mt-0.5">How your brand is classified on the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryCard label="Main Category" item={category} gradient="bg-emerald-50" />
        <CategoryCard label="Sub - Category" item={subCategory} gradient="bg-amber-50" />
      </div>
    </section>
  );
};

export default CategoryInfoSection;
