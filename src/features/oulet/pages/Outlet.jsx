import { useState } from "react";

import { useNavigate } from "react-router-dom";
const BRAND_DATA = {
  companyName: "Yoga Education And Research Pvt Ltd",
  merchantToken: "A4FG1WJOIUN20",
  gstNo: "33AAFPA2907F1ZF",
  panNo: "ABCDE1234F",
};

const VALID_PROMO_CODES = {
  TRYDOOD20: "20% off applied! Code TRYDOOD20 accepted.",
  YOGA10: "10% off applied! Code YOGA10 accepted.",
  OUTLET50: "₹50 flat discount applied! Code OUTLET50 accepted.",
};

const CONFETTI_ITEMS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  color: [
    "#f472b6",
    "#818cf8",
    "#34d399",
    "#fb923c",
    "#facc15",
    "#60a5fa",
    "#a78bfa",
    "#f87171",
    "#2dd4bf",
  ][Math.floor(Math.random() * 9)],
  left: Math.random() * 100,
  top: Math.random() * 90,
  isDash: Math.random() > 0.5,
  width: Math.random() * 10 + 6,
  height: Math.random() * 6 + 3,
  rotate: Math.floor(Math.random() * 60 - 30),
}));

export default function TrydoodOutlet() {
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState(null); // null | { type: "success"|"error", message: string }

  const navigate = useNavigate();
  const togglePromo = () => {
    setPromoOpen((prev) => !prev);
    setPromoCode("");
    setPromoStatus(null);
  };

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoStatus({ type: "error", message: "Please enter a promo code." });
      return;
    }
    if (VALID_PROMO_CODES[code]) {
      setPromoStatus({
        type: "success",
        message: `✓ ${VALID_PROMO_CODES[code]}`,
      });
    } else {
      setPromoStatus({
        type: "error",
        message: "✗ Invalid promo code. Please try again.",
      });
    }
  };

  const handleAddListing = () => {
    alert("Redirecting to Add Listing...");
    // navigate("/add-listing") or your router call
    navigate("/brand-outlet");
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Confetti */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-0">
        {CONFETTI_ITEMS.map((item) => (
          <span
            key={item.id}
            className="absolute opacity-80"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              background: item.color,
              width: item.isDash ? `${item.width}px` : `${item.height}px`,
              height: item.isDash ? `${item.height / 2}px` : `${item.height}px`,
              borderRadius: item.isDash ? "2px" : "50%",
              transform: item.isDash ? `rotate(${item.rotate}deg)` : undefined,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-10 pb-16">
        {/* Header */}
        <div className="text-center pt-10 pb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a2e] mb-2">
            Welcome To Trydood!
          </h1>
          <p className="text-sm text-gray-500">
            Set up your organisation before you run your Listings
          </p>
        </div>

        {/* Card */}
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">
            Create Your Brand Outlet's
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Register your outlet to showcase your products, services, and
            offers. Reach more customers and grow your business easily.
          </p>

          <hr className="border-gray-200 mb-6" />

          {/* Brand Details */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Brand Details
          </p>
          <p className="text-base font-bold text-[#1a1a2e] mb-5">
            {BRAND_DATA.companyName}
          </p>

          <div className="flex flex-wrap gap-8 mb-8 text-sm text-gray-700">
            <span>
              Merchant Token :{" "}
              <span className="text-indigo-500 font-medium">
                {BRAND_DATA.merchantToken}
              </span>
            </span>
            <span>
              GST No :{" "}
              <span className="text-indigo-500 font-medium">
                {BRAND_DATA.gstNo}
              </span>
            </span>
            <span>
              PAN No :{" "}
              <span className="text-indigo-500 font-medium">
                {BRAND_DATA.panNo}
              </span>
            </span>
          </div>

          {/* Promo Code Accordion */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 bg-gray-50">
            <button
              onClick={togglePromo}
              className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none"
            >
              <span className="text-sm font-semibold text-gray-700">
                Have a Promo Code?{" "}
                <span className="ml-2 inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                  Optional
                </span>
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${promoOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                promoOpen ? "max-h-52 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Enter Promo Code
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder="e.g. TRYDOOD20"
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 bg-white text-gray-800 transition-colors"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-5 py-2.5 bg-[#1a1a2e] text-white text-sm font-medium rounded-lg hover:bg-[#2d2d5e] transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>

                {promoStatus && (
                  <div
                    className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      promoStatus.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {promoStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Listing Button */}
          <button
            onClick={handleAddListing}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1a1a2e] text-white text-base font-semibold rounded-xl hover:bg-[#2d2d5e] active:scale-[0.99] transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Listing
          </button>
        </div>
      </div>
    </div>
  );
}
