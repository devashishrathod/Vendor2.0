import React from "react";

import GstPanSection from "../components/GstPanSection";

/**
 * GstPanPage
 * "GST & PAN Information" tab — brand's registered address, GSTIN,
 * PAN details, taxpayer type, and current GST status.
 *
 * `brand` is the real brand object fetched by BrandPage (via useBrandData)
 * and passed down as a prop — brand.gst and brand.pan hold the relevant data.
 */
const GstPanPage = ({ brand }) => {
  return <GstPanSection gst={brand?.gst} pan={brand?.pan} />;
};

export default GstPanPage;