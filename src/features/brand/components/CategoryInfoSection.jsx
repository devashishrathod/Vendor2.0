import React from "react";
import InfoItem from "./InfoItem";

/**
 * CategoryInfoSection
 * category and subCategory are separate top-level fields on the brand
 * object in the real API (brand.category, brand.subCategory) — not one
 * nested inside the other. Each is an object with a `name` field.
 */
const CategoryInfoSection = ({ category, subCategory }) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M7 7h.01M3 12V7a2 2 0 012-2h5.586a1 1 0 01.707.293l7 7a1 1 0 010 1.414l-5.586 5.586a1 1 0 01-1.414 0l-7-7A1 1 0 013 12z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">Category Information</h2>
          <p className="text-xs text-gray-400 mt-0.5">How your brand is classified on the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Main Category" value={category?.name || "—"} />
        <InfoItem label="Sub - Category" value={subCategory?.name || "—"} />
      </div>
    </section>
  );
};

export default CategoryInfoSection;