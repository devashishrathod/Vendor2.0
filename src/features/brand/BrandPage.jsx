import { useRef, useState } from "react";

import BrandHeader from "./components/BrandHeader";
import BrandTabs from "./components/BrandTabs";

import BrandProfilePage from "./pages/BrandProfilePage";
import OutletLocationPage from "./pages/OutletLocationPage";
import ShowcasePage from "./pages/ShowcasePage";
import BankAccountPage from "./pages/BankAccountPage";
import ListingFeaturesPage from "./pages/ListingFeaturesPage";
import GstPanPage from "./pages/GstPanPage";
import ComingSoonPage from "./pages/ComingSoonPage";

import useBrandData from "./hooks/useBrandData";
import { useAuthStore } from "../onboarding/store/authStore";
import { BRAND_TABS } from "./utils/BrandHelpers";
import { updateBrandDetails } from "./services/brandApi";


import ScanQrCodePage from "./pages/ScanQrCodePage";
import BrandDescriptionPage from "./pages/BrandDescriptionPage";
import BusinessHoursPage from "./pages/BusinessHoursPage";

// Maps each tab id to the page component that renders its content.
// Add an entry here whenever a new tab gets a real UI.
const TAB_PAGES = {
  "brand-profile": BrandProfilePage,
  "description": BrandDescriptionPage,
  "showcase-details": ShowcasePage,
  "bank-account-details": BankAccountPage,
  "listing-features": ListingFeaturesPage,
  "gst-pan-information": GstPanPage,
  "business-hours": BusinessHoursPage,
  "outlet-location": OutletLocationPage,
  "scan-qr-code": ScanQrCodePage,
};

/**
 * BrandPage
 * Thin shell for the merchant "Brand Page" settings area — renders the
 * header + tab bar, then delegates all tab content to its own page
 * component (see ./pages). Each page owns its own data loading & UI.
 *
 * brandId is read from the logged-in user's session (authStore.user.brandId),
 * set after WhatsApp OTP verification. No mock data fallback — if the
 * brandId is missing or the fetch fails, the page shows a clear state
 * instead of silently rendering fake data.
 */
const BrandPage = ({ brandId: brandIdProp }) => {
  const [activeTab, setActiveTab] = useState("brand-profile");

  const sessionBrandId = useAuthStore((s) => s.user?.brandId);
  const brandId = brandIdProp || sessionBrandId;

  const { data: brand, loading, error, reload } = useBrandData(brandId);

  // Logo change/view now lives on the header (not the Brand Profile tab) —
  // PUT /brands/update?brandId= with only the logo file, same as before.
  const logoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

  const handleChangeLogo = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
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

  const activeTabLabel = BRAND_TABS.find((tab) => tab.id === activeTab)?.label;
  const ActivePage = TAB_PAGES[activeTab];

  // ── No brandId at all — user isn't linked to a brand yet ──
  if (!brandId) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500">
              No brand is linked to your account yet. Please complete onboarding first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetching brand data ──
  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-400">Loading brand details…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch failed ──
  if (error) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-red-500">
              Couldn't load brand data: {error}
            </p>
            <button
              onClick={reload}
              className="mt-3 inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No data returned (shouldn't normally happen if brandId is valid) ──
  if (!brand) {
    return (
      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500">No brand data found.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Real data loaded successfully ──
  return (
    <div>
      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <BrandHeader
            brandName={brand.brandName}
            merchantId={brand.merchantId}
            logo={brand.logo}
            onChangeLogo={handleChangeLogo}
            logoUpdating={uploadingLogo}
            logoError={logoError}
            isApproved={brand.isApproved}
            joinedDate={brand.joinedDate}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />

          <div className="mt-6">
            <BrandTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="mt-8">
            {ActivePage ? (
              <ActivePage
                brandId={brandId}
                brand={brand}
                brandLoading={loading}
                brandError={error}
                reload={reload}
              />
            ) : (
              <ComingSoonPage label={activeTabLabel} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPage;