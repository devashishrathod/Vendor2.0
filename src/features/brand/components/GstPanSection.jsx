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
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          GST &amp; PAN Information
        </h2>
        <p className="mt-2 text-sm text-gray-400">Not available yet.</p>
      </section>
    );
  }

  // "Active" styling based on GST registration status, since there's no
  // dedicated gstStatus field — closest real equivalent is registrationStatus.
  const isActive = gst?.registrationStatus?.toUpperCase() === "SUCCESS";

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
        GST &amp; PAN Information
      </h2>

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
            <p
              className={`mt-1 text-sm font-medium ${
                isActive ? "text-emerald-500" : "text-gray-500"
              }`}
            >
              {gst?.registrationStatus || "—"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GstPanSection;