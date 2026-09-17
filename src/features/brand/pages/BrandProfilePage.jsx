import { useEffect, useState } from "react";
import BrandProfileSection from "../components/BrandProfileSection";
import CategoryInfoSection from "../components/CategoryInfoSection";
import { getSubBrands } from "@/features/voucher/services/voucher/VoucherService";
// import CategoryTagSection from "../components/CategoryTagSection";

const BrandProfilePage = ({ brand, brandId, brandLoading, brandError, reload }) => {
  // Real outlet count for the "Outlet Count" field — same GET
  // /subBrands/get-all?brandId= the Voucher Details page uses.
  const [outletCount, setOutletCount] = useState(null);
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    getSubBrands({ brandId, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setOutletCount(res?.data?.total ?? res?.data?.data?.length ?? 0);
      })
      .catch((err) => console.error("Failed to load outlet count:", err.message));
    return () => { cancelled = true; };
  }, [brandId]);

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

      <BrandProfileSection profile={brand} outletCount={outletCount} reload={reload} />

      

      <CategoryInfoSection
        category={brand.category}
        subCategory={brand.subCategory}
      />

      {/* <CategoryTagSection categoryTagLine={brand.categoryTagLine} /> */}
    </div>
  );
};

export default BrandProfilePage;
