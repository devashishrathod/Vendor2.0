import { useRef, useState } from "react";

import BrandProfileSection from "../components/BrandProfileSection";
import CategoryInfoSection from "../components/CategoryInfoSection";
import CategoryTagSection from "../components/CategoryTagSection";
import { updateBrandDetails } from "../services/brandApi";

const BrandProfilePage = ({ brandId, brand, brandLoading, brandError, reload }) => {
  const logoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

  const handleChangeLogo = () => {
    logoInputRef.current?.click();
  };

  // PUT /brands/update?brandId= — sending only the logo file (no other
  // brandPayload fields) so this is a logo-only update, nothing else on
  // the brand gets touched.
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be re-selected next time
    if (!file) return;

    try {
      setUploadingLogo(true);
      setLogoError("");
      await updateBrandDetails(brandId, {}, file);
      await reload?.();
    } catch (err) {
      console.error("Brand logo update failed:", err);
      setLogoError(err.message || "Failed to update logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
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

      {logoError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          {logoError}
        </p>
      )}

      <BrandProfileSection
        profile={brand}
        onChangeLogo={handleChangeLogo}
        logoUpdating={uploadingLogo}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoFileChange}
      />

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
