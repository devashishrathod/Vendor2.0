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
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}

      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">Outlet Location</h2>
        </div>
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