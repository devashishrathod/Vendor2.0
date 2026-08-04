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

  return (
    <div className="space-y-10">
      {brandError && (
        <p className="text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}

      <BrandProfileSection profile={brand} onChangeLogo={handleChangeLogo} />

      <hr className="border-gray-100" />

      <CategoryInfoSection category={brand.category} />

      <CategoryTagSection categoryTagLine={brand.categoryTagLine} />
    </div>
  );
};

export default BrandProfilePage;