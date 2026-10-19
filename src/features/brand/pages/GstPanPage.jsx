import GstPanSection from "../components/GstPanSection";

/**
 * GstPanPage
 * "GST & PAN Information" tab — brand's registered address, GSTIN,
 * PAN details, taxpayer type, and current GST status.
 *
 * `brand` is the real brand object fetched by BrandPage (via useBrandData)
 * and passed down as a prop — brand.gst and brand.pan hold the relevant data.
 * `reload` refetches the brand after a PAN/GST change is saved.
 */
const GstPanPage = ({ brand, brandId, reload }) => {
  return <GstPanSection gst={brand?.gst} pan={brand?.pan} brandId={brandId} onUpdated={reload} />;
};

export default GstPanPage;