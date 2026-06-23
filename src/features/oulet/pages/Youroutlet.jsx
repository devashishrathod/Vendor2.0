import { useNavigate } from "react-router-dom";
import logo from "@/assets/Logo1.jpg"; // ✅ apna logo path yahan daal do

import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";

export default function YourOutlet() {
  const navigate = useNavigate();
    const { formData } = useOnboardingStore();

   const brandData = {
    companyName:   formData.gstDetails?.legalName   || formData.businessName || "—",
    merchantToken: formData.marchentId                  || "A4FG1WJOIUN20",
    gstNo:         formData.gstDetails?.gstNumber    || formData.gstin        || "—",
    panNo:         formData.pan                      || "—",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12  flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="Trydood"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="text-emerald-400 text-xs font-bold hidden">T</span>
          </div>
        </div>

        <div className="w-[34px] h-[34px] bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Page heading */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">Your Outlet</h1>
        <p className="text-xs text-gray-400 mb-6">
          Overview · Showcase your listing outlet
        </p>

        {/* Alert banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            Your listing is under review.
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Trydood will review your listing details and verify them soon. If
            there are any errors, your submission will be put on hold. The
            Trydood team will contact you shortly.
          </p>
        </div>

        {/* Outlet card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Outlet row */}
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Outlet logo */}
            <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
               {brandData.companyName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Merchant Token: {brandData.merchantToken} &nbsp;·&nbsp; <br /> Created on: February
                22 | 03:14
              </p>
            </div>

            {/* Recheck button */}
            <button
              onClick={() => console.log("Recheck clicked")}
              className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-lg bg-white
                hover:bg-gray-50 text-gray-600 text-xs font-semibold
                transition-all duration-150 active:scale-[0.97]"
            >
              Recheck
            </button>
          </div>

          {/* Manage bar */}
          <button
            onClick={() => navigate("/outlet/manage")}
            className="w-full border-t border-gray-100 px-5 py-3 flex items-center justify-center
              gap-2 text-gray-500 hover:bg-gray-50 transition-colors duration-150 group"
          >
            <svg
              className="w-4 h-4 group-hover:rotate-45 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-semibold">Manage your outlet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
