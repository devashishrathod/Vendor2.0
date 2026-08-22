import React from "react";

import BrandProfileSection from "../components/BrandProfileSection";
import CategoryInfoSection from "../components/CategoryInfoSection";
import CategoryTagSection from "../components/CategoryTagSection";

const BrandProfilePage = ({ brand, brandLoading, brandError }) => {
  const handleChangeLogo = () => {
    console.log("Change brand logo clicked");
  };

  if (brandLoading) {
    return <p className="text-sm text-gray-400">Loading brand profile…</p>;
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">No brand data found.</p>;
  }

  return (
    <div className="space-y-10">
      {brandError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}

      <BrandProfileSection profile={brand} onChangeLogo={handleChangeLogo} />

      <hr className="border-gray-100" />

      <CategoryInfoSection
        category={brand.category}
        subCategory={brand.subCategory}
      />

      <CategoryTagSection categoryTagLine={brand.categoryTagLine} />
    </div>
  );
};

export default BrandProfilePage;