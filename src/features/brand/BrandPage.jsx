import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import BrandHeader from "./components/BrandHeader";
import BrandTabs from "./components/BrandTabs";

import BrandProfilePage from "./pages/BrandProfilePage";
import ShowcasePage from "./pages/ShowcasePage";
import BankAccountPage from "./pages/BankAccountPage";
import ListingFeaturesPage from "./pages/ListingFeaturesPage";
import GstPanPage from "./pages/GstPanPage";
import ComingSoonPage from "./pages/ComingSoonPage";

import { updateBrandProfile } from "@/features/onboarding-v2/services/brandSetupApi";
import useBrandData from "./hooks/useBrandData";
import useProfileRefresh from "./hooks/useProfileRefresh";
import { useAuthStore } from "../onboarding/store/authStore";
import { BRAND_TABS } from "./utils/BrandHelpers";


import BrandDescriptionPage from "./pages/BrandDescriptionPage";
import BusinessHoursPage from "./pages/BusinessHoursPage";
import DocumentsPage from "./pages/DocumentsPage";
import BillingAddressPage from "./pages/BillingAddressPage";

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
  "documents": DocumentsPage,
  "billing-address": BillingAddressPage,
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
const DEFAULT_TAB = BRAND_TABS[0].id;

const BrandPage = ({ brandId: brandIdProp }) => {
  // Active tab lives in the URL (?tab=listing-features) so a page refresh
  // keeps the user on the same tab instead of resetting to Brand Profile.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = BRAND_TABS.some((tab) => tab.id === tabParam) ? tabParam : DEFAULT_TAB;

  const setActiveTab = useCallback(
    (tabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tabId === DEFAULT_TAB) next.delete("tab");
          else next.set("tab", tabId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const sessionBrandId = useAuthStore((s) => s.user?.brandId);
  const brandId = brandIdProp || sessionBrandId;

  const { data: brand, loading, error, reload } = useBrandData(brandId);
  const refresh = useProfileRefresh(reload);

  // Logo and cover image live on the header — PUT /brands/update with only
  // that file (never brandName / category / isOnboarding).
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(null); // "logo" | "coverImage" | null
  const [imageError, setImageError] = useState("");

  const handleImageFileChange = (kind) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploadingImage(kind);
      setImageError("");
      await updateBrandProfile({}, { [kind]: file });
      await refresh();
    } catch (err) {
      console.error(`Brand ${kind} update failed:`, err);
      setImageError(err.message || "Failed to update the image. Please try again.");
    } finally {
      setUploadingImage(null);
    }
  };

  const activeTabLabel = BRAND_TABS.find((tab) => tab.id === activeTab)?.label;
  const ActivePage = TAB_PAGES[activeTab];

  // ── No brandId at all — user isn't linked to a brand yet ──
  if (!brandId) {
    return (
      <div className="min-h-screen bg-app dark:bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
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
      <div className="min-h-screen bg-app dark:bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-400">Loading brand details…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch failed ──
  if (error) {
    return (
      <div className="min-h-screen  dark:bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-red-500">
              Couldn't load brand data: {error}
            </p>
            <button
              onClick={reload}
              className="mt-3 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      <div className="min-h-screen bg-app dark:bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500">No brand data found.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Real data loaded successfully ──
  return (
    <div>
      <div className="min-h-screen bg-app dark:bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <BrandHeader
            brandName={brand.brandName}
            merchantId={brand.merchantId}
            logo={brand.logo}
            coverImage={brand.coverImage}
            onChangeLogo={() => logoInputRef.current?.click()}
            onChangeCover={() => coverInputRef.current?.click()}
            uploading={uploadingImage}
            imageError={imageError}
            isVerified={brand.isVerified === true}
            joinedDate={brand.joinedDate}
          />
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageFileChange("logo")} />
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageFileChange("coverImage")} />

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