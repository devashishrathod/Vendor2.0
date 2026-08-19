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
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
        Category Information
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Main Category" value={category?.name || "—"} />
        <InfoItem label="Sub - Category" value={subCategory?.name || "—"} />
      </div>
    </section>
  );
};

export default CategoryInfoSection;