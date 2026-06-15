import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Data ────────────────────────────────────────────────────────────────────
const PLAN_DATA = {
  name: "Basic Plan",
  yearlyPrice: 1999,
  originalPrice: 4000,
  billingCycle: "Yearly Plan",
  discountPercent: 50,
  renewalDate: "February 2027",
  duration: "One Year Plan – 365 Days Plan Active",
  igstRate: 0.18,
};

const INITIAL_BILLING = {
  brandName: "Yoga Education And Research Pvt Ltd",
  address: "New No. 9 (Old No. 23), Plot No. 4363, 4th Floor, X Block, 5th Street, Annanagar West, Chennai – 600040",
  cin: "U47912TN2023PTC163139",
  gstin: "09AAKFF2211N2ZA",
  pan: "ABCDE1234F",
};

const TRUST_BADGES = [
  { icon: "⭐", label: "1 Million Trusted Partner Ship", rating: "13,02,55 (Review)" },
  { icon: "🏷️", label: "10,00,000 New Listing Brand" },
  { icon: "🛒", label: "One Destination, 5 Million Products" },
];

const VALID_PROMO_CODES = {
  SAVE10: 10,
  YOGA20: 20,
  WELCOME2026: 18,
};

// ─── Utils ───────────────────────────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

// ─── TrustBar ────────────────────────────────────────────────────────────────
function TrustBar({ badges }) {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 mb-6">
      <div className="flex flex-wrap items-center justify-center gap-6 divide-x divide-gray-300">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-2 px-4 first:pl-0 last:pr-0">
            <span className="text-lg">{b.icon}</span>
            <span className="text-sm font-medium text-gray-700">{b.label}</span>
            {b.rating && (
              <>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-teal-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{b.rating}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PlanInfo ─────────────────────────────────────────────────────────────────
function PlanInfo({ plan }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-4 border-b border-gray-100">
        Subscribe to {plan.name}
      </h2>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl font-extrabold text-gray-900">{fmt(plan.yearlyPrice)}</span>
        <span className="text-gray-500 font-medium">/ {plan.billingCycle}</span>
        <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-md">
          {plan.discountPercent}% Off
        </span>
      </div>
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-800 mb-1">Plan Duration</p>
        <p className="text-sm text-gray-600">{plan.duration}</p>
      </div>
      <p className="text-sm text-gray-600">
        Your renewal{" "}
        <span className="font-semibold">
          {plan.renewalDate} for {fmt(plan.yearlyPrice)}
        </span>
      </p>
    </div>
  );
}

// ─── BillingDetailsCard ───────────────────────────────────────────────────────
const BILLING_FIELDS = [
  { key: "brandName", label: "Brand name", type: "text" },
  { key: "address",   label: "Address",    type: "textarea" },
  { key: "cin",       label: "CIN",        type: "text" },
  { key: "gstin",     label: "GSTIN",      type: "text" },
  { key: "pan",       label: "Pan",        type: "text" },
];

function BillingDetailsCard({ details, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(details);

  const handleEdit = () => {
    setDraft(details);
    setEditing(true);
  };

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(details);
    setEditing(false);
  };

  const handleChange = (key, val) => setDraft((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Billing Details</h3>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {BILLING_FIELDS.map(({ key, label, type }) => (
          <div key={key} className="px-6 py-4 grid grid-cols-3 gap-4 items-start">
            <span className="text-sm font-semibold text-gray-700 col-span-1 pt-1">{label}</span>
            <div className="col-span-2">
              {editing ? (
                type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={draft[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={draft[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                  />
                )
              ) : (
                <span className="text-sm text-gray-600">{details[key]}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save bar when editing */}
      {editing && (
        <div className="px-6 py-4 bg-teal-50 border-t border-teal-100 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PromoCodePanel ───────────────────────────────────────────────────────────
function PromoCodePanel({ appliedCode, appliedPct, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleApply = () => {
    const key = code.trim().toUpperCase();
    const pct = VALID_PROMO_CODES[key];
    if (pct) {
      onApply(key, pct);
      setCode("");
      setError("");
      setOpen(false);
    } else {
      setError("Invalid promo code. Please try again.");
    }
  };

  const handleRemove = () => {
    onRemove();
    setCode("");
    setError("");
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Have a promo code?</span>
        {!appliedCode && (
          <button
            onClick={() => { setOpen((v) => !v); setError(""); }}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            {open ? "Hide" : "Apply Here"}
          </button>
        )}
      </div>

      {/* Input panel */}
      {open && !appliedCode && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Have a promo code? Type here"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
            <button
              onClick={handleApply}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => { setOpen(false); setError(""); setCode(""); }}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────
function SummaryRow({ label, value, muted, accent, sub }) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${muted ? "text-gray-500" : "text-gray-700"}`}>{label}</span>
        <span className={`text-sm font-semibold ${muted ? "text-gray-500" : accent ? "text-teal-600" : "text-gray-800"}`}>
          {value}
        </span>
      </div>
      {sub && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{sub.label}</span>
          <button onClick={sub.onRemove} className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────
function OrderSummary({ plan }) {
  const [appliedCode, setAppliedCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
    const navigate = useNavigate();

  const billValue = plan.yearlyPrice;
  const promoSaving = parseFloat(((billValue * promoDiscount) / 100).toFixed(2));
  const discountedBill = billValue - promoSaving;
  const igst = parseFloat((discountedBill * plan.igstRate).toFixed(2));
  const totalPayable = parseFloat((discountedBill + igst).toFixed(2));
  const totalSaved = parseFloat((plan.originalPrice - discountedBill + (promoSaving > 0 ? 0 : 0)).toFixed(2));
  // total saved = originalPrice minus what they actually pay (ex-tax)
  const totalSavedFull = parseFloat((plan.originalPrice + igst - totalPayable).toFixed(2));

  const handleApply = (code, pct) => {
    setAppliedCode(code);
    setPromoDiscount(pct);
  };

  const handleRemove = () => {
    setAppliedCode("");
    setPromoDiscount(0);
  };

    const handleCheckout = () => {
        // For demo, we'll just alert the summary. In real app, you'd integrate with payment gateway here.
        navigate('/oulet');
    };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

      <div className="space-y-4 mb-5">
        <SummaryRow label="Original Price" value={fmt(plan.originalPrice)} muted />
        <SummaryRow label="Bill Value" value={fmt(billValue)} />
        <SummaryRow label={`IGST @ ${(plan.igstRate * 100).toFixed(2)}%`} value={fmt(igst)} />

        {/* Promo discount row — only visible when code is applied */}
        {appliedCode && (
          <SummaryRow
            label="Trydood Discount"
            value={`-${fmt(promoSaving)}`}
            accent
            sub={{
              label: appliedCode,
              onRemove: handleRemove,
            }}
          />
        )}
      </div>

      {/* Total */}
      <div className="border-t border-dashed border-gray-200 pt-4 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">You'll Pay</span>
          <span className="text-xl font-extrabold text-gray-900">{fmt(totalPayable)}</span>
        </div>
        <p className="text-sm text-gray-500 font-medium mt-1">
          You saved{" "}
          <span className="text-teal-600 font-semibold">{fmt(totalSavedFull)}</span> on This Plan
        </p>
      </div>

      <div className="border-t border-gray-100 my-5" />

      {/* Promo Code Toggle */}
      <PromoCodePanel
        appliedCode={appliedCode}
        appliedPct={promoDiscount}
        onApply={handleApply}
        onRemove={handleRemove}
      />

      {/* Checkout */}
      <button onClick={handleCheckout} className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all duration-150 mb-3">
        Check Out
      </button>

      <div className="text-center">
        <p className="text-xs font-semibold text-gray-600 mb-1">🔒 100% Secure payment</p>
        <p className="text-xs text-gray-500">
          We also accept Indian Debit Cards, UPI and Netbanking.
        </p>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SubscriptionCheckout() {
  const [billing, setBilling] = useState(INITIAL_BILLING);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <TrustBar badges={TRUST_BADGES} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <PlanInfo plan={PLAN_DATA} />
            <BillingDetailsCard details={billing} onSave={setBilling} />
          </div>

          {/* Right */}
          <OrderSummary plan={PLAN_DATA} />
        </div>
      </div>
    </div>
  );
}