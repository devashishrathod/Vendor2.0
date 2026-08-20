import React from "react";
import InfoItem from "./InfoItem";

const CategoryTagSection = ({ categoryTagLine }) => {
  // The real /brands/get API doesn't currently return a categoryTagLine
  // field at all (only `category` and `subCategory`). Until the backend
  // adds this, render nothing rather than crashing.
  if (!categoryTagLine) {
    return (
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900 leading-tight">Category Tag Line</h2>
        </div>
        <p className="mt-2 text-sm text-gray-400 pl-12">
          Not available yet.
        </p>
      </section>
    );
  }

  const tags = categoryTagLine.tags || [];

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-gray-900 leading-tight">Category Tag Line</h2>
      </div>
      <p className="mt-2 text-sm text-gray-500 pl-12">
        {categoryTagLine.helperText}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {tags.map((tag) => (
          <InfoItem
            key={tag.id}
            label={`Tag Count ${tag.id}`}
            value={tag.label}
          />
        ))}
      </div>
    </section>
  );
};

export default CategoryTagSection;