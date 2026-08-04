import React from "react";






import Branddata from "../data/Branddata";
import OutletLocationMap from "@/features/BrandPage/components/OutletLocationMap";
import OutletManualAddressSection from "@/features/BrandPage/components/OutletManualAddressSection";
import OutletAddressSection from "@/features/BrandPage/components/OutletAddressSection";
import GstAddressSection from "@/features/BrandPage/components/GstAddressSection";
import useOutletLocation from "@/features/BrandPage/hooks/useOutletLocation";
import AccountManagerSection from "@/features/BrandPage/components/AccountManagerSection";

const OutletLocationPage = ({ merchantToken }) => {
  const { data, loading, error } = useOutletLocation(merchantToken);
  const outlet = data || Branddata.outletLocation;

  if (loading) {
    return <p className="text-sm text-gray-400">Loading outlet location…</p>;
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          Outlet Location
        </h2>
        <div className="mt-5">
          <OutletLocationMap
            latitude={outlet.latitude}
            longitude={outlet.longitude}
          />
        </div>
      </section>

      <OutletAddressSection locationAndAddress={outlet.locationAndAddress} />

      <OutletManualAddressSection manualLocation={outlet.manualLocation} />

      <GstAddressSection gstAddress={outlet.gstAddress} />

      <AccountManagerSection
        accountSetupManager={outlet.accountSetupManager}
      />
    </div>
  );
};

export default OutletLocationPage;