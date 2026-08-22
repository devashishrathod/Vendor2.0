import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../../../hooks/useBrand";

const DEFAULT_PLAN = {
  name: "Basic Plan",
  originalPrice: 4000,
  igstRate: 0.18,
};

const CONFETTI_COLORS = [
  "#f472b6", "#818cf8", "#34d399", "#fb923c", "#facc15",
  "#60a5fa", "#a78bfa", "#f87171", "#2dd4bf",
];

// Beautiful falling confetti — mixed shapes, staggered timing, gentle drift.
// Fall distance is generous (600px) and matched by a full-height container
// below, so pieces are visible for their whole journey instead of vanishing
// the instant they leave a too-short clipping box.
const CONFETTI_ITEMS = Array.from({ length: 60 }, (_, i) => {
  const shape = Math.random();
  return {
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    left: Math.random() * 100,
    size: Math.random() * 8 + 6,
    duration: Math.random() * 3 + 4, // 4s - 7s
    delay: Math.random() * 5,
    drift: Math.random() * 80 - 40, // sideways sway in px
    rotateStart: Math.floor(Math.random() * 360),
    isCircle: shape < 0.34,
    isDash: shape >= 0.34 && shape < 0.67,
  };
});

const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlanSummaryCard({ planName, billValue, originalPrice, igstRate, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const igst = parseFloat((billValue * igstRate).toFixed(2));
  const trydoodDiscount = parseFloat(igst.toFixed(2));
  const totalPayable = parseFloat((billValue + igst - trydoodDiscount).toFixed(2));

  const rows = [
    { label: "Original Price", value: fmt(originalPrice), accent: false },
    { label: "Bill Value", value: fmt(billValue), accent: false },
    { label: `IGST @ ${(igstRate * 100).toFixed(2)}%`, value: fmt(igst), accent: false },
    { label: "Trydood Discount", value: `-${fmt(trydoodDiscount)}`, accent: true },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <p className="text-sm font-semibold text-gray-700">Plan Name : {planName}</p>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-5 py-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-sm font-semibold ${row.accent ? "text-teal-600" : "text-gray-800"}`}>
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
            <span className="text-sm font-bold text-gray-900">Total Paid</span>
            <span className="text-base font-extrabold text-gray-900">{fmt(totalPayable)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @param {object}  props
 * @param {object}  [props.orderData] - the `data` object from your subscribe-order API response
 * @param {boolean} [props.asModal]   - render as a centered overlay instead of a full page
 * @param {Function}[props.onClose]   - required when asModal is true
 */
export default function WelcomePage({ orderData = null, asModal = true, onClose }) {
  const { brand, loading } = useBrand();
  const navigate = useNavigate();

  if (loading) return <div>Loading...</div>;

  const brandData = {
    companyName: brand?.legalBusinessName || brand?.brandName || "—",
    merchantToken: brand?.merchantId || "—",
    gstNo: brand?.gst?.gstNumber || "—",
    panNo: brand?.pan?.pan || "—",
  };

  const billValue = orderData?.amount ?? 1999;

  const handleAddListing = () => {
    if (asModal && onClose) onClose();
    navigate("/brand-outlet");
  };

  return (
    <div
      className={
        asModal
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          : "relative min-h-screen bg-white"
      }
    >
      {/*
        Fixed: pieces now stay opaque for most of the fall and only fade
        right at the end, and they travel 600px so they're visible the
        whole time inside the full-height confetti container below
        (previously they fell 220px inside a 96px-tall clipped box, so
        ~80% of the animation was invisible).
      */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(600px) translateX(var(--drift)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      <div
        className={
          asModal
            ? "relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            : "relative w-full overflow-hidden font-sans"
        }
      >
        {/* Confetti — spans the full card/modal height so the fall is never clipped */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-2xl">
          {CONFETTI_ITEMS.map((item) => (
            <span
              key={item.id}
              className="absolute"
              style={{
                left: `${item.left}%`,
                top: "-10px",
                background: item.color,
                width: item.isDash ? `${item.size * 1.6}px` : `${item.size}px`,
                height: item.isCircle ? `${item.size}px` : `${item.size * 0.5}px`,
                borderRadius: item.isCircle ? "50%" : "2px",
                willChange: "transform, opacity",
                "--drift": `${item.drift}px`,
                "--rot": `${item.rotateStart + 360}deg`,
                animation: `confetti-fall ${item.duration}s ease-in ${item.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {asModal && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className={`relative p-6 z-10 ${asModal ? "px-6 pb-6" : "px-6 md:px-10 pb-16"}`}>
          <div className={`text-center ${asModal ? "pt-8 pb-6" : "pt-10 pb-10"}`}>
            {orderData && (
              <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold">
                ✅ Payment Successful
              </div>
            )}
            <h1 className={`font-semibold text-[#1a1a2e] mb-2 ${asModal ? "text-2xl" : "text-3xl md:text-4xl"}`}>
              Welcome To Trydood!
            </h1>
            <p className="text-sm text-gray-500">
              Set up your organisation before you run your Listings
            </p>
          </div>

          <div
            className={
              asModal
                ? "bg-white"
                : "max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
            }
          >
            {!asModal && (
              <>
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Create Your Brand Outlet's</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Register your outlet to showcase your products, services, and offers.
                  Reach more customers and grow your business easily.
                </p>
                <hr className="border-gray-200 mb-6" />
              </>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brand Details</p>
            <p className="text-base font-bold text-[#1a1a2e] capitalize mb-4">{brandData.companyName}</p>

            <div className={`flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm text-gray-700 ${asModal ? "flex-col sm:flex-row" : ""}`}>
              <span>Merchant Token : <span className="text-indigo-500 font-medium">{brandData.merchantToken}</span></span>
              <span>GST No : <span className="text-indigo-500 font-medium">{brandData.gstNo}</span></span>
              <span>PAN No : <span className="text-indigo-500 font-medium">{brandData.panNo}</span></span>
            </div>

            <PlanSummaryCard
              planName={DEFAULT_PLAN.name}
              billValue={billValue}
              originalPrice={DEFAULT_PLAN.originalPrice}
              igstRate={DEFAULT_PLAN.igstRate}
              defaultOpen={asModal}
            />

            <button
              onClick={handleAddListing}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1a1a2e] text-white text-base font-semibold rounded-xl hover:bg-[#2d2d5e] active:scale-[0.99] transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}