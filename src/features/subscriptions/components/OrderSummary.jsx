import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateOrderTotals, formatINR } from "../utils/priceCalculator";
import { useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
import SummaryRow from "./SummaryRow";
import PromoCodePanel from "./PromoCodePanel";

export default function OrderSummary({ plan, brandId, businessName, billingDetails }) {
  const [appliedCode, setAppliedCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const navigate = useNavigate();

  const { billValue, promoSaving, igst, totalPayable, totalSaved, igstRate } =
    calculateOrderTotals(plan, promoDiscount);

  const { pay, processing, error } = useRazorpayCheckout();

  const handleApply = (code, pct) => {
    setAppliedCode(code);
    setPromoDiscount(pct);
  };
  const handleRemove = () => {
    setAppliedCode("");
    setPromoDiscount(0);
  };

  // Calls our backend to create a Razorpay order for this plan, opens the
  // Razorpay checkout widget, then verifies the payment once it succeeds.
  // const handleCheckout = async () => {
  //   if (!brandId) {
  //     // Shouldn't happen in practice — brandId comes from useBrand() upstream —
  //     // but guard against a silently missing prop instead of crashing the API call.
  //     console.error("OrderSummary: missing brandId — cannot create a payment order.");
  //     return;
  //   }
  //   try {
  //     await pay({
  //       brandId,
  //       subscriptionId: plan.id ?? plan._id,
  //       businessDetails: {
  //         brandName: businessName,
  //         email: billingDetails?.email,
  //         phone: billingDetails?.phone,
  //       },
  //       onSuccess: () => navigate("/oulet"),
  //     });
  //   } catch {
  //     // error is already surfaced below via the hook's `error` state
  //   }
  // };

  const handleCheckout = async () => {
    navigate("/oulet" )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

      <div className="space-y-4 mb-5">
        <SummaryRow label="Original Price" value={formatINR(plan.price)} muted />
        <SummaryRow label="Bill Value" value={formatINR(billValue)} />
        <SummaryRow
          label={`IGST @ ${(igstRate * 100).toFixed(2)}%`}
          value={formatINR(igst)}
        />
        {appliedCode && (
          <SummaryRow
            label="Trydood Discount"
            value={`-${formatINR(promoSaving)}`}
            accent
            sub={{ label: appliedCode, onRemove: handleRemove }}
          />
        )}
      </div>

      <div className="border-t border-dashed border-gray-200 pt-4 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">You'll Pay</span>
          <span className="text-xl font-extrabold text-gray-900">
            {formatINR(totalPayable)}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-medium mt-1">
          You saved{" "}
          <span className="text-teal-600 font-semibold">{formatINR(totalSaved)}</span>{" "}
          on This Plan
        </p>
      </div>

      <div className="border-t border-gray-100 my-5" />

      <PromoCodePanel
        appliedCode={appliedCode}
        onApply={handleApply}
        onRemove={handleRemove}
      />

      {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={processing}
        className="w-full active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all duration-150 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)",
        }}
        onMouseEnter={(e) => {
          if (!processing) {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #07a077 0%, #1a1a3e 100%)";
          }
        }}
        onMouseLeave={(e) => {
          if (!processing) {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)";
          }
        }}
      >
        {processing ? "Opening secure checkout…" : "Check Out"}
      </button>

      <div className="text-center">
        <p className="text-xs font-semibold text-gray-600 mb-1">
          🔒 100% Secure payment
        </p>
        <p className="text-xs text-gray-500">
          We also accept Indian Debit Cards, UPI and Netbanking.
        </p>
      </div>
    </div>
  );
}