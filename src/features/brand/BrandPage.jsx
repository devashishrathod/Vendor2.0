// import React, { useState } from "react";





// import useBrandData from "./hooks/useBrandData";
// import Branddata from "./data/Branddata";
// import BrandHeader from "./component/BrandHeader";
// import BrandTabs from "./component/BrandTabs";
// import CategoryInfoSection from "./component/CategoryInfoSection";
// import CategoryTagSection from "./component/CategoryTagSection";
// import BrandProfileSection from "./component/BrandProfileSection";
// import DashboardHeader from "../dashboard/components/DashboardHeader";

// /**
//  * BrandPage
//  * Merchant-facing "Brand Profile" settings page — header, section tabs,
//  * and the Brand Profile / Category Information / Category Tag Line content.
//  *
//  * Props:
//  * - merchantToken: id used to fetch this brand's data via the API service.
//  *   Defaults to the mock Branddata's token so this renders out of the box.
//  */
// const BrandPage = ({ merchantToken = Branddata.merchantToken }) => {
//   const [activeTab, setActiveTab] = useState("brand-profile");
//   const { data, loading, error } = useBrandData(merchantToken);

//   const brand = data || Branddata; // fall back to mock data while loading/on error

//   const handleChangeLogo = () => {
//     // Wire this up to services/brandApi.js -> uploadBrandLogo(...)
//     console.log("Change brand logo clicked");
//   };

//   return (
//  <div>
//   <DashboardHeader/>
//      <div className="min-h-screen bg-white px-6 py-8 md:px-10">
//       <div className="mx-auto max-w-6xl">
//         <BrandHeader
//           brandName={brand.brandName}
//           merchantToken={brand.merchantToken}
//         />

//         <div className="mt-6">
//           <BrandTabs activeTab={activeTab} onTabChange={setActiveTab} />
//         </div>

//         {error && (
//           <p className="mt-4 text-sm text-red-500">
//             Couldn't load live data ({error}). Showing cached details.
//           </p>
//         )}

//         {activeTab === "brand-profile" && (
//           <div className="mt-8 space-y-10">
//             {loading ? (
//               <p className="text-sm text-gray-400">Loading brand profile…</p>
//             ) : (
//               <>
//                 <BrandProfileSection
//                   profile={brand}
//                   onChangeLogo={handleChangeLogo}
//                 />

//                 <hr className="border-gray-100" />

//                 <CategoryInfoSection category={brand.category} />

//                 <CategoryTagSection categoryTagLine={brand.categoryTagLine} />
//               </>
//             )}
//           </div>
//         )}

//         {activeTab !== "brand-profile" && (
//           <div className="mt-10 text-sm text-gray-400">
//             This section hasn't been built yet.
//           </div>
//         )}
//       </div>
//     </div>
//  </div>
//   );
// };

// export default BrandPage;


import React, { useState } from "react";

import BrandHeader from "./components/BrandHeader";
import BrandTabs from "./components/BrandTabs";

import BrandProfilePage from "./pages/BrandProfilePage";
import OutletLocationPage from "./pages/OutletLocationPage";
import ShowcasePage from "./pages/ShowcasePage";
import BankAccountPage from "./pages/BankAccountPage";
import ListingFeaturesPage from "./pages/ListingFeaturesPage";
import GstPanPage from "./pages/GstPanPage";
import ComingSoonPage from "./pages/ComingSoonPage";

import Branddata from "./data/Branddata";
import useBrandData from "./hooks/useBrandData";
import { BRAND_TABS } from "./utils/BrandHelpers";
import BusinessHours from "./components/BusinessHours";
import BrandDescription from "./components/BrandDescription";
import ScanQrCodePage from "./pages/ScanQrCodePage";


// Maps each tab id to the page component that renders its content.
// Add an entry here whenever a new tab gets a real UI.
const TAB_PAGES = {
  "brand-profile": BrandProfilePage,
  "description":BrandDescription,
  "showcase-details": ShowcasePage,
  "bank-account-details": BankAccountPage,
  "listing-features": ListingFeaturesPage,
  "gst-pan-information": GstPanPage,
  "business-hours":BusinessHours,
  "outlet-location": OutletLocationPage,
  "scan-qr-code":ScanQrCodePage
};

/**
 * BrandPage
 * Thin shell for the merchant "Brand Page" settings area — renders the
 * header + tab bar, then delegates all tab content to its own page
 * component (see ./pages). Each page owns its own data loading & UI.
 *
 * Props:
 * - merchantToken: id used to fetch this brand's data via the API service.
 *   Defaults to the mock Branddata's token so this renders out of the box.
 */
const BrandPage = ({ merchantToken = Branddata.merchantToken }) => {
  const [activeTab, setActiveTab] = useState("brand-profile");
  const { data, loading, error } = useBrandData(merchantToken);
  const brand = data || Branddata; // fall back to mock data while loading/on error

  const activeTabLabel = BRAND_TABS.find((tab) => tab.id === activeTab)?.label;
  const ActivePage = TAB_PAGES[activeTab];

  return (
 <div>
 
     <div className="min-h-screen bg-white px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <BrandHeader
          brandName={brand.brandName}
          merchantToken={brand.merchantToken}
        />

        <div className="mt-6">
          <BrandTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="mt-8">
          {ActivePage ? (
            <ActivePage
              merchantToken={merchantToken}
              brand={brand}
              brandLoading={loading}
              brandError={error}
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