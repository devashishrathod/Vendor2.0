// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { calculateOrderTotals, formatINR } from "../utils/priceCalculator";
// import { useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
// import SummaryRow from "./SummaryRow";
// import PromoCodePanel from "./PromoCodePanel";
// import WelcomePage from "../pages/WelcomePage"; // 👈 adjust to the real relative path

// export default function OrderSummary({ plan, brandId, businessName, billingDetails }) {
//   const [appliedCode, setAppliedCode] = useState("");
//   const [promoDiscount, setPromoDiscount] = useState(0);
//   const [successOrder, setSuccessOrder] = useState(null); // holds the API response's `data`
//   const navigate = useNavigate();

//   const { billValue, promoSaving, igst, totalPayable, totalSaved, igstRate } =
//     calculateOrderTotals(plan, promoDiscount);

//   const { pay, processing, error } = useRazorpayCheckout();

//   const handleApply = (code, pct) => { setAppliedCode(code); setPromoDiscount(pct); };
//   const handleRemove = () => { setAppliedCode(""); setPromoDiscount(0); };

//   const handleCheckout = async () => {
//     if (!brandId) {
//       console.error("OrderSummary: missing brandId — cannot create a payment order.");
//       return;
//     }
//     try {
//       await pay({
//         brandId,
//         subscriptionId: plan.id ?? plan._id,
//         businessDetails: {
//           brandName: businessName,
//           email: billingDetails?.email,
//           phone: billingDetails?.phone,
//         },
//         // Instead of navigating away, pop the WelcomePage modal with the
//         // real order payload (amount, invoiceId, status, contact, etc.)
//         onSuccess: (response) => {
//           setSuccessOrder(response?.data ?? response);
//         },
//       });
//     } catch {
//       // error is already surfaced below via the hook's `error` state
//     }
//   };

//   return (
//     <>
//       <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
//         <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

//         <div className="space-y-4 mb-5">
//           <SummaryRow label="Original Price" value={formatINR(plan.price)} muted />
//           <SummaryRow label="Bill Value" value={formatINR(billValue)} />
//           <SummaryRow label={`IGST @ ${(igstRate * 100).toFixed(2)}%`} value={formatINR(igst)} />
//           {appliedCode && (
//             <SummaryRow
//               label="Trydood Discount"
//               value={`-${formatINR(promoSaving)}`}
//               accent
//               sub={{ label: appliedCode, onRemove: handleRemove }}
//             />
//           )}
//         </div>

//         <div className="border-t border-dashed border-gray-200 pt-4 mb-2">
//           <div className="flex items-center justify-between">
//             <span className="text-base font-bold text-gray-900">You'll Pay</span>
//             <span className="text-xl font-extrabold text-gray-900">{formatINR(totalPayable)}</span>
//           </div>
//           <p className="text-sm text-gray-500 font-medium mt-1">
//             You saved{" "}
//             <span className="text-teal-600 font-semibold">{formatINR(totalSaved)}</span>{" "}
//             on This Plan
//           </p>
//         </div>

//         <div className="border-t border-gray-100 my-5" />

//         <PromoCodePanel appliedCode={appliedCode} onApply={handleApply} onRemove={handleRemove} />

//         {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

//         <button
//           onClick={handleCheckout}
//           disabled={processing}
//           className="w-full active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all duration-150 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
//           style={{ background: "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)" }}
//           onMouseEnter={(e) => { if (!processing) e.currentTarget.style.background = "linear-gradient(135deg, #07a077 0%, #1a1a3e 100%)"; }}
//           onMouseLeave={(e) => { if (!processing) e.currentTarget.style.background = "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)"; }}
//         >
//           {processing ? "Opening secure checkout…" : "Check Out"}
//         </button>

//         <div className="text-center">
//           <p className="text-xs font-semibold text-gray-600 mb-1">🔒 100% Secure payment</p>
//           <p className="text-xs text-gray-500">We also accept Indian Debit Cards, UPI and Netbanking.</p>
//         </div>
//       </div>

//       {successOrder && (
//         <WelcomePage
//           orderData={successOrder}
//           asModal
//           onClose={() => setSuccessOrder(null)}
//         />
//       )}
//     </>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateOrderTotals, formatINR } from "../utils/priceCalculator";
import { useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
import SummaryRow from "./SummaryRow";
import PromoCodePanel from "./PromoCodePanel";
import WelcomePage from "../pages/WelcomePage"; // 👈 adjust to the real relative path
import PaymentStatusOverlay from "./PaymentStatusOverlay"; // 👈 adjust to the real relative path

export default function OrderSummary({ plan, brandId, businessName, billingDetails }) {
  const [appliedCode, setAppliedCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [successOrder, setSuccessOrder] = useState(null); // API response's `data`, once confirmed
  // Single source of truth for what the person sees after tapping Check Out:
  // 'idle' -> 'processing' -> 'success' -> WelcomePage modal, OR 'processing' -> 'failed'
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const navigate = useNavigate();

  const { billValue, promoSaving, igst, totalPayable, totalSaved, igstRate } =
    calculateOrderTotals(plan, promoDiscount);

  const { pay, processing, error } = useRazorpayCheckout();

  const handleApply = (code, pct) => { setAppliedCode(code); setPromoDiscount(pct); };
  const handleRemove = () => { setAppliedCode(""); setPromoDiscount(0); };

  const handleCheckout = async () => {
    if (!brandId) {
      console.error("OrderSummary: missing brandId — cannot create a payment order.");
      return;
    }

    // Show the animated "Verifying your payment…" screen the instant we
    // start — this is the gap that used to feel stuck with nothing on
    // screen. It stays up until we know success or failure for sure.
    setPaymentState("processing");
    setPaymentError("");

    try {
      await pay({
        brandId,
        subscriptionId: plan.id ?? plan._id,
        businessDetails: {
          brandName: businessName,
          email: billingDetails?.email,
          phone: billingDetails?.phone,
        },
        onSuccess: (response) => {
          setSuccessOrder(response?.data ?? response);
          setPaymentState("success"); // overlay plays the checkmark animation, then hands off
        },
        onFailure: (err) => {
          setPaymentError(err?.description || err?.message || "");
          setPaymentState("failed");
        },
      });
    } catch (err) {
      // Covers thrown errors from pay() itself (network failure, the
      // Razorpay popup being closed/cancelled by the person, backend
      // verification failing, etc.) — anything that isn't a clean
      // onFailure callback still lands on the same failure screen.
      setPaymentError(err?.message || error || "");
      setPaymentState("failed");
    }
  };

  const handleRetry = () => {
    setPaymentState("idle");
    // Small delay so the retry doesn't fire mid-unmount of the overlay.
    setTimeout(handleCheckout, 150);
  };

  const handleCancelFailure = () => {
    setPaymentState("idle");
    setPaymentError("");
  };

  // Called by the overlay once the success animation has finished playing.
  const handleSuccessAnimationDone = () => {
    setPaymentState("idle");
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

        <div className="space-y-4 mb-5">
          <SummaryRow label="Original Price" value={formatINR(plan.price)} muted />
          <SummaryRow label="Bill Value" value={formatINR(billValue)} />
          <SummaryRow label={`IGST @ ${(igstRate * 100).toFixed(2)}%`} value={formatINR(igst)} />
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
            <span className="text-xl font-extrabold text-gray-900">{formatINR(totalPayable)}</span>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            You saved{" "}
            <span className="text-teal-600 font-semibold">{formatINR(totalSaved)}</span>{" "}
            on This Plan
          </p>
        </div>

        <div className="border-t border-gray-100 my-5" />

        <PromoCodePanel appliedCode={appliedCode} onApply={handleApply} onRemove={handleRemove} />

        {error && paymentState === "idle" && (
          <p className="text-sm text-red-500 mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handleCheckout}
          disabled={processing || paymentState === "processing"}
          className="w-full active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all duration-150 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)" }}
          onMouseEnter={(e) => { if (!processing) e.currentTarget.style.background = "linear-gradient(135deg, #07a077 0%, #1a1a3e 100%)"; }}
          onMouseLeave={(e) => { if (!processing) e.currentTarget.style.background = "linear-gradient(135deg, #09B285 0%, #0F0E20 100%)"; }}
        >
          {processing || paymentState === "processing" ? "Opening secure checkout…" : "Check Out"}
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-600 mb-1">🔒 100% Secure payment</p>
          <p className="text-xs text-gray-500">We also accept Indian Debit Cards, UPI and Netbanking.</p>
        </div>
      </div>

      {(paymentState === "processing" || paymentState === "success" || paymentState === "failed") && (
        <PaymentStatusOverlay
          status={paymentState}
          errorMessage={paymentError}
          onSuccessDone={handleSuccessAnimationDone}
          onRetry={handleRetry}
          onCancel={handleCancelFailure}
        />
      )}

      {/* Shows only after the success overlay has finished its animation */}
      {paymentState === "idle" && successOrder && (
        <WelcomePage
          orderData={successOrder}
          asModal
          onClose={() => setSuccessOrder(null)}
        />
      )}
    </>
  );
}