import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../../../hooks/useBrand";
import { getCurrentSubscription } from "../services/subscriptionApi";

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

// ⚠️ Confirmed real GET /subscribeds/get response has NO invoice field at
// all (checked: brand, isSubscribed, subscription{...}, lastSubscription,
// entitlements, usage, totalSubscriptions — nothing invoice-shaped). Kept
// here for whichever endpoint eventually adds one, checking the common
// plausible names a Cloudinary-hosted document link tends to use elsewhere
// in this app (see brand.logo, showcase images, etc.) — the button below
// stays visible but disabled until a real field shows up.
function getInvoiceUrl(source) {
  if (!source) return null;
  return (
    source.invoiceUrl ||
    source.invoicePdfUrl ||
    source.invoice?.url ||
    source.invoice?.pdfUrl ||
    source.receiptUrl ||
    null
  );
}

// Content-width (not full-width) — sits top-right in a card's header row,
// next to the plan name/status, rather than as its own full block.
function DownloadInvoiceButton({ invoiceUrl, className = "" }) {
  return (
    <button
      type="button"
      onClick={() => invoiceUrl && window.open(invoiceUrl, "_blank", "noopener,noreferrer")}
      disabled={!invoiceUrl}
      title={invoiceUrl ? "Download invoice" : "Invoice not available yet"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex-shrink-0 ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
      </svg>
      Download Invoice
    </button>
  );
}

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

// Renders the real POST /transactions/subscribe/create-order response's
// `orderSummary` (same shape as the checkout preview's) as-is — no local
// GST/discount math here. `strikePrice` (the plan's own pre-discount
// price, when the backend sets one) overrides the "Original Price" row's
// display; otherwise that row already shows the real list price.
// Backend sends discount row labels with a computed decimal percentage
// (e.g. "Discount (50.02% off)") — truncated here to a whole number
// ("Discount (50% off)"), not rounded, matching the "drop what's after the
// point" ask.
function truncatePercentInLabel(label) {
  if (!label) return label;
  return label.replace(/(\d+(?:\.\d+)?)%/, (_match, num) => `${Math.floor(parseFloat(num))}%`);
}

function PlanSummaryCard({ planName, orderSummary, strikePrice, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const rows = orderSummary?.rows ?? [];
  const payable = orderSummary?.payable;
  if (rows.length === 0) return null;

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
          {rows.map((row) => {
            const isOriginal = row.key === "ORIGINAL_PRICE";
            const isDiscount = /discount/i.test(row.label || "");
            // strikePrice is often 0 (confirmed field, meaning "none set"),
            // not null/undefined — `!= null` alone let a real 0 through and
            // overrode the actual Original Price with "₹0.00".
            const value = isOriginal && strikePrice > 0 ? fmt(strikePrice) : row.display;
            return (
              <div key={row.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{truncatePercentInLabel(row.label)}</span>
                <span
                  className={`text-sm font-semibold ${
                    isDiscount ? "text-teal-600" : isOriginal ? "text-gray-400 line-through" : "text-gray-800"
                  }`}
                >
                  {value}
                </span>
              </div>
            );
          })}
          {payable && (
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
              <span className="text-sm font-bold text-gray-900">{payable.label || "Total Paid"}</span>
              <span className="text-base font-extrabold text-gray-900">{payable.display}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const USAGE_KEYS = ["subBrands", "franchises", "vouchers", "showcase"];

// Shown when this page is visited on its own (no `orderData` from a just-
// completed checkout) — GET /subscribeds/get, "My current subscription".
// Confirmed real response shape: data.subscription.{status, startDate,
// endDate, daysRemaining, durationLabel, paidAmount, transactionId,
// pricing{...}, plan{name, type, typeLabel, price, features[], benefits[]}},
// plus data.usage{subBrands/franchises/vouchers/showcase}. Every field
// below maps 1:1 to that confirmed shape — nothing guessed.
function CurrentSubscriptionCard({ sub }) {
  const subscription = sub?.subscription;
  if (!subscription) return null;

  const plan = subscription.plan || {};
  const pricing = subscription.pricing || {};
  const usage = sub?.usage || {};

  const isActive = subscription.status === "ACTIVE";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-700 min-w-0 truncate">
          Current Plan : {plan.name || "—"}
          {plan.typeLabel ? ` (${plan.typeLabel})` : ""}
        </p>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {subscription.status || "—"}
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Validity */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400">Valid From</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(subscription.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Valid Until</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(subscription.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Days Remaining</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{subscription.daysRemaining ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Duration</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{subscription.durationLabel || "—"}</p>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="space-y-2 pt-3 border-t border-dashed border-gray-200">
          {pricing.listPrice != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">List Price</span>
              <span className="text-sm font-semibold text-gray-400 line-through">{fmt(pricing.listPrice)}</span>
            </div>
          )}
          {pricing.discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Discount ({Math.floor(pricing.discountPercent || 0)}% off)
              </span>
              <span className="text-sm font-semibold text-teal-600">-{fmt(pricing.discountAmount)}</span>
            </div>
          )}
          {pricing.gstAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                GST{pricing.gstPercentage != null ? ` (${pricing.gstPercentage}%)` : ""}
              </span>
              <span className="text-sm font-semibold text-gray-800">{fmt(pricing.gstAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
            <span className="text-sm font-bold text-gray-900">Total Paid</span>
            <span className="text-base font-extrabold text-gray-900">
              {fmt(subscription.paidAmount ?? pricing.totalPayable)}
            </span>
          </div>
          {pricing.youSaved > 0 && (
            <p className="text-xs text-teal-600 font-medium text-right">
              You saved {fmt(pricing.youSaved)} on this plan
            </p>
          )}
        </div>

        {/* Plan features */}
        {plan.features?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plan Features</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {plan.features.map((f) => (
                <div key={f.title} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{f.title}</span>
                  <span className={`font-medium ${f.available ? "text-gray-800" : "text-gray-300"}`}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {plan.benefits?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Benefits</p>
            <ul className="space-y-1">
              {plan.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-teal-500 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage */}
        {Object.keys(usage).length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Usage</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {USAGE_KEYS.map((key) => {
                const u = usage[key];
                if (!u) return null;
                return (
                  <div key={key}>
                    <p className="text-xs text-gray-400 capitalize">{u.label || key}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {u.used ?? 0}
                      {u.isUnlimited ? " / Unlimited" : u.limit != null ? ` / ${u.limit}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @param {object}  props
 * @param {object}  [props.orderData] - the `data` object from your subscribe-order API response
 * @param {boolean} [props.asModal]   - render as a centered overlay instead of a full page
 * @param {Function}[props.onClose]   - required when asModal is true
 * @param {string}  [props.returnTo]  - where the primary CTA sends the vendor afterwards. Set
 *   only when this checkout was reached via the "Plan & Billing" page's Upgrade button (see
 *   useSubscription's goToPlans) — an existing vendor who just upgraded should land back on
 *   their plan/billing page, not get routed into the brand-new-vendor onboarding step below.
 */
export default function WelcomePage({ orderData = null, asModal = true, onClose, returnTo }) {
  const { brand, loading } = useBrand();
  const navigate = useNavigate();

  // Always fetched — GET /subscribeds/get?brandId=, "My current
  // subscription". Passed explicitly with this brand's own _id (from
  // useBrand() above) rather than omitted, per confirmed usage. The
  // invoice link lives on THIS response, not on the create-order
  // `orderData` prop, so this is fetched even in the fresh-checkout/
  // asModal case, purely to power the Download Invoice button — the plan
  // SUMMARY shown still prefers `orderData` when present (see the render
  // below).
  const [currentSub, setCurrentSub] = useState(null);
  useEffect(() => {
    if (!brand?._id) return;
    let cancelled = false;
    getCurrentSubscription(brand._id)
      .then((res) => { if (!cancelled) setCurrentSub(res); })
      .catch((err) => console.error("Failed to load current subscription:", err.message));
    return () => { cancelled = true; };
  }, [brand?._id]);

  if (loading) return <div>Loading...</div>;

  const brandData = {
    companyName: brand?.legalBusinessName || brand?.brandName || "—",
    merchantToken: brand?.merchantId || "—",
    gstNo: brand?.gst?.gstNumber || "—",
    panNo: brand?.pan?.pan || "—",
  };

  const planName = orderData?.plan?.name || "—";
  const strikePrice = orderData?.plan?.strikePrice;
  const orderSummary = orderData?.orderSummary;
  const invoiceUrl = getInvoiceUrl(orderData) || getInvoiceUrl(currentSub);

  const handlePrimaryCta = () => {
    if (asModal && onClose) onClose();
    navigate(returnTo || "/brand-outlet");
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

            <div className="flex justify-end mb-2">
              <DownloadInvoiceButton invoiceUrl={invoiceUrl} />
            </div>

            {orderData ? (
              <PlanSummaryCard
                planName={planName}
                orderSummary={orderSummary}
                strikePrice={strikePrice}
                defaultOpen={asModal}
              />
            ) : (
              currentSub && <CurrentSubscriptionCard sub={currentSub} />
            )}

            <button
              onClick={handlePrimaryCta}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1a1a2e] text-white text-base font-semibold rounded-xl hover:bg-[#2d2d5e] active:scale-[0.99] transition-all"
            >
              {returnTo ? (
                "Continue"
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Listing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}