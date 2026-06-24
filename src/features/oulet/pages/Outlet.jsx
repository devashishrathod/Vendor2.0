import { useNavigate } from "react-router-dom";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";

const PLAN_DATA = {
  name: "Basic Plan",
  yearlyPrice: 1999,
  originalPrice: 4000,
  igstRate: 0.18,
  discountPercent: 50,
};

const CONFETTI_ITEMS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  color: [
    "#f472b6","#818cf8","#34d399","#fb923c","#facc15",
    "#60a5fa","#a78bfa","#f87171","#2dd4bf",
  ][Math.floor(Math.random() * 9)],
  left:   Math.random() * 100,
  top:    Math.random() * 90,
  isDash: Math.random() > 0.5,
  width:  Math.random() * 10 + 6,
  height: Math.random() * 6 + 3,
  rotate: Math.floor(Math.random() * 60 - 30),
}));

const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

function PlanSummaryCard({ plan }) {
  const billValue      = plan.yearlyPrice;
  const igst           = parseFloat((billValue * plan.igstRate).toFixed(2));
  const trydoodDiscount = parseFloat((igst).toFixed(2)); // matches screenshot: discount = igst amount
  const totalPayable   = parseFloat((billValue + igst - trydoodDiscount).toFixed(2));

  const rows = [
    { label: "Original Price",   value: fmt(plan.originalPrice), accent: false },
    { label: "Bill Value",       value: fmt(billValue),          accent: false },
    { label: `IGST @ ${(plan.igstRate * 100).toFixed(2)}%`, value: fmt(igst), accent: false },
    { label: "Trydood Discount", value: `-${fmt(trydoodDiscount)}`, accent: true  },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 bg-white">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-700">
          Plan Name : {plan.name}
        </p>
      </div>

      {/* Rows */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Plan Name : {plan.name}
        </p>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{row.label}</span>
            <span
              className={`text-sm font-semibold ${
                row.accent ? "text-teal-600" : "text-gray-800"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrydoodOutlet() {
  const { formData } = useOnboardingStore();
  const navigate     = useNavigate();

  const brandData = {
    companyName:   formData.gstDetails?.legalName   || formData.businessName || "—",
    merchantToken: formData.brandId                  || "—",
    gstNo:         formData.gstDetails?.gstNumber    || formData.gstin        || "—",
    panNo:         formData.pan                      || "—",
  };

  const handleAddListing = () => navigate("/brand-outlet");

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Confetti */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-0">
        {CONFETTI_ITEMS.map((item) => (
          <span
            key={item.id}
            className="absolute opacity-80"
            style={{
              left:         `${item.left}%`,
              top:          `${item.top}%`,
              background:   item.color,
              width:        item.isDash ? `${item.width}px`      : `${item.height}px`,
              height:       item.isDash ? `${item.height / 2}px` : `${item.height}px`,
              borderRadius: item.isDash ? "2px"                  : "50%",
              transform:    item.isDash ? `rotate(${item.rotate}deg)` : undefined,
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
            {brandData.companyName}
          </p>

          <div className="flex flex-wrap gap-8 mb-8 text-sm text-gray-700">
            <span>
              Merchant Token :{" "}
              <span className="text-indigo-500 font-medium">
                {brandData.merchantToken}
              </span>
            </span>
            <span>
              GST No :{" "}
              <span className="text-indigo-500 font-medium">
                {brandData.gstNo}
              </span>
            </span>
            <span>
              PAN No :{" "}
              <span className="text-indigo-500 font-medium">
                {brandData.panNo}
              </span>
            </span>
          </div>

          {/* Plan Summary Card */}
          <PlanSummaryCard plan={PLAN_DATA} />

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