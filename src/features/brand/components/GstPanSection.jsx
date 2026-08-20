import React from "react";
import InfoItem from "./InfoItem";

// Builds a single-line address from the gst.address object shape
// returned by the real API (buildingNumber, buildingName, location, ...).
const formatGstAddress = (address) => {
  if (!address) return "—";
  return (
    address.location ||
    [address.buildingNumber, address.buildingName, address.city, address.state, address.pin]
      .filter(Boolean)
      .join(", ")
  );
};

/**
 * GstPanSection
 * gst and pan are separate top-level fields on the brand object
 * (brand.gst, brand.pan) in the real API — there is no single combined
 * "gstPanInformation" object, and fields like brandName/subtitle/gstStatus
 * don't exist under those names at all.
 */
const GstPanSection = ({ gst, pan }) => {
  if (!gst && !pan) {
    return (
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900">GST &amp; PAN Information</h2>
        </div>
        <p className="mt-2 text-sm text-gray-400">Not available yet.</p>
      </section>
    );
  }

  // "Active" styling based on GST registration status, since there's no
  // dedicated gstStatus field — closest real equivalent is registrationStatus.
  const isActive = gst?.registrationStatus?.toUpperCase() === "SUCCESS";

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-gray-900">GST &amp; PAN Information</h2>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 p-5">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
          <InfoItem label="Brand name" value={gst?.legalName || gst?.tradeName || "—"} />
          <div className="lg:col-span-2">
            <InfoItem label="Address" value={formatGstAddress(gst?.address)} />
          </div>
          <InfoItem label="GSTIN" value={gst?.gstNumber || "—"} />
          <InfoItem
            label="Pan Details"
            value={pan ? `${pan.pan} (${pan.fullName})` : "—"}
          />
          <InfoItem label="Taxpayer type" value={gst?.taxpayerType || "—"} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              GST status
            </p>
            {isActive ? (
              <span className="mt-1 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {gst?.registrationStatus || "—"}
              </span>
            ) : (
              <p className="mt-1 text-sm font-medium text-gray-500">
                {gst?.registrationStatus || "—"}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GstPanSection;