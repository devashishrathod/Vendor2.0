import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
import SummaryRow from "./SummaryRow";
import PromoCodePanel from "./PromoCodePanel";
import WelcomePage from "../pages/WelcomePage"; // 👈 adjust to the real relative path
import PaymentStatusOverlay from "./PaymentStatusOverlay"; // 👈 adjust to the real relative path

/**
 * OrderSummary
 * Renders POST /transactions/subscribe/preview's `orderSummary`/`promo`/
 * `notices` as-is (rows/payable/savedText are already formatted
 * server-side — no local GST/discount math here anymore) and drives the
 * Razorpay flow off `subscriptionId` alone (no brandId — the backend
 * resolves that from the logged-in vendor's session).
 */
export default function OrderSummary({
  subscriptionId,
  orderSummary,
  pricing,
  promo,
  canProceed,
  blockedReason,
  notices,
  businessName,
  billingDetails,
  onApplyPromo,
  onRemovePromo,
  applyingPromo,
  promoError,
}) {
  const navigate = useNavigate();
  const [successOrder, setSuccessOrder] = useState(null); // API response's `data`, once confirmed
  // Single source of truth for what the person sees after tapping Check Out:
  // 'idle' -> 'processing' -> 'success' -> WelcomePage modal, OR 'processing' -> 'failed'
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");

  const { pay, processing, error } = useRazorpayCheckout();

  const handleCheckout = async () => {
    if (!subscriptionId) {
      console.error("OrderSummary: missing subscriptionId — cannot create a payment order.");
      return;
    }

    // Show the animated "Verifying your payment…" screen the instant we
    // start — this is the gap that used to feel stuck with nothing on
    // screen. It stays up until we know success or failure for sure.
    setPaymentState("processing");
    setPaymentError("");

    try {
      await pay({
        subscriptionId,
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

  const rows = orderSummary?.rows ?? [];
  const payable = orderSummary?.payable;
  const canCheckout = canProceed !== false; // treat undefined as proceedable

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

        <div className="space-y-4 mb-5">
          {rows.map((row) => {
            const isDiscountRow = /discount/i.test(row.label || "");
            return (
              <SummaryRow
                key={row.key}
                label={row.label}
                value={row.display}
                muted={row.key === "ORIGINAL_PRICE"}
                strike={row.key === "ORIGINAL_PRICE"}
                accent={isDiscountRow}
                sub={
                  isDiscountRow && pricing?.promoCode
                    ? { label: pricing.promoCode, onRemove: onRemovePromo }
                    : undefined
                }
              />
            );
          })}
        </div>

        {/* Not-yet-applied promo entry — once pricing.promoCode is set, the
            discount row above already carries the code + Remove control,
            so this prompt disappears rather than duplicating it. */}
        {promo?.supported && !pricing?.promoCode && (
          <PromoCodePanel
            onApply={onApplyPromo}
            applying={applyingPromo}
            error={promoError}
          />
        )}
        {!promo?.supported && (
          <p className="mb-5 text-sm text-gray-500">
            {promo?.message || "Have a promo code? Coming soon."}
          </p>
        )}

        {payable && (
          <div className="border-t border-dashed border-gray-200 pt-4 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">{payable.label}</span>
              <span className="text-xl font-extrabold text-gray-900">{payable.display}</span>
            </div>
            {orderSummary?.savedText && (
              <p className="text-sm text-gray-500 font-medium mt-1">{orderSummary.savedText}</p>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 my-5" />

        {notices?.length > 0 && (
          <div className="mb-5 space-y-2">
            {notices.map((notice, i) => (
              <p key={i} className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {notice}
              </p>
            ))}
          </div>
        )}

        {!canCheckout && blockedReason && (
          <p className="text-sm text-amber-600 mb-3 text-center">{blockedReason}</p>
        )}

        {error && paymentState === "idle" && (
          <p className="text-sm text-red-500 mb-3 text-center">{error}</p>
        )}

        {canCheckout ? (
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
        ) : (
          // canProceed:false means the backend already considers this
          // handled (e.g. already paid/subscribed) — don't let Checkout
          // keep hitting create-order in that state, just move the vendor
          // forward instead.
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full active:scale-[0.99] text-white font-bold text-base py-4 rounded-xl transition-all duration-150 mb-3 bg-emerald-600 hover:bg-emerald-700"
          >
            Continue
          </button>
        )}

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