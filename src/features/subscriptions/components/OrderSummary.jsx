import { useState, useEffect } from "react";
import { Lock, ReceiptText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getErrorCode, getErrorDetails } from "@/services/http/apiError";
import { isOnboardingCompleteNow } from "@/features/onboarding/utils/onboardingStatus";
import { ONBOARDING_ERROR_CODES } from "@/features/onboarding-v2/config/screens";
import { useOnboardingFlow } from "@/features/onboarding-v2/hooks/useOnboardingFlow";
import { NOT_PAYMENT_FAILURES, useRazorpayCheckout } from "../hooks/useRazorpayCheckout";
import { formatINR, mergeGstRowsToIgst } from "../utils/priceCalculator";
import SummaryRow from "./SummaryRow";
import PromoCodePanel from "./PromoCodePanel";
import WelcomePage from "../pages/WelcomePage"; // 👈 adjust to the real relative path
import PaymentStatusOverlay from "./PaymentStatusOverlay"; // 👈 adjust to the real relative path
import ErrorToast from "@/components/common/ErrorToast";

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
  returnTo,
  onPaid,
  plan,
  orderSummary,
  pricing,
  promo,
  canProceed,
  requiresPayment,
  blockedReason,
  billingAddressRequired = false,
  onBillingRequired,
  businessName,
  billingDetails,
  onApplyPromo,
  onRemovePromo,
  applyingPromo,
  promoJustRemoved,
  promoError,
}) {
  const navigate = useNavigate();
  // The server's screen is the only routing source (guide §2.2).
  const { goToServerScreen } = useOnboardingFlow();
  const [successOrder, setSuccessOrder] = useState(null); // API response's `data`, once confirmed
  // Single source of truth for what the person sees after tapping Check Out:
  // 'idle' -> 'processing' -> 'success' -> WelcomePage modal, OR 'processing' -> 'failed'
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");

  const { pay, processing, error } = useRazorpayCheckout();
  const [toastError, setToastError] = useState(null);

  // create-order refusals that aren't payment failures (no money moved):
  // 422 BILLING_ADDRESS_REQUIRED → open the billing form (never the failure
  // screen); 409 ONBOARDING_SCREEN_MISMATCH → the server's screen.
  const handlePayError = (err) => {
    const code = getErrorCode(err);
    if (NOT_PAYMENT_FAILURES.includes(code)) {
      setPaymentState("idle");
      setPaymentError("");
      if (code === ONBOARDING_ERROR_CODES.BILLING_ADDRESS_REQUIRED) onBillingRequired?.(getErrorDetails(err));
      else goToServerScreen(getErrorDetails(err)?.currentScreen);
      return;
    }
    setPaymentError(err?.description || err?.message || error || "");
    setPaymentState("failed");
  };

  const handleCheckout = async () => {
    if (!subscriptionId) {
      console.error("OrderSummary: missing subscriptionId — cannot create a payment order.");
      return;
    }
    if (billingAddressRequired) {
      onBillingRequired?.(null);
      return;
    }

    // Show the animated "Verifying your payment…" screen the instant we
    // start — this is the gap that used to feel stuck with nothing on
    // screen. It stays up until we know success or failure for sure.
    setPaymentState("processing");
    setPaymentError("");

    try {
      const result = await pay({
        subscriptionId,
        businessDetails: {
          brandName: businessName,
          email: billingDetails?.email,
          phone: billingDetails?.phone,
        },
        // Only sent when the vendor actually applied one — pricing.promoCode
        // is unset until a successful apply, so this stays undefined
        // (and createOrder's payload just omits the field) otherwise.
        promoCode: pricing?.promoCode,
        onSuccess: (response) => {
          // Lets checkout mark this plan paid so a refresh can't reopen it.
          onPaid?.();
          setSuccessOrder(response?.data ?? response);
          setPaymentState("success"); // overlay plays the checkmark animation, then hands off
        },
        onFailure: handlePayError,
      });
      // ⚠️ FIXED: useRazorpayCheckout's modal.ondismiss resolves with `null`
      // when the person closes the Razorpay widget without paying — that's
      // a clean resolve, not a throw, and neither onSuccess nor onFailure
      // above ever fires for it. Nothing was resetting paymentState out of
      // "processing" in that case, so the "Verifying your payment…" overlay
      // stayed on screen indefinitely even though there was nothing left to
      // verify. Only reset here when the promise settled with no result —
      // the success path already moved paymentState to "success" itself.
      if (result === null) {
        setPaymentState("idle");
      }
    } catch (err) {
      // Covers thrown errors from pay() itself (network failure, the
      // Razorpay popup being closed/cancelled by the person, backend
      // verification failing, etc.) — anything that isn't a clean
      // onFailure callback still lands on the same failure screen.
      handlePayError(err);
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

  // CGST + SGST from the API → one "IGST @ 18%" row, like the upgrade flow.
  const rows = mergeGstRowsToIgst(orderSummary?.rows ?? [], pricing);
  const payable = orderSummary?.payable;
  const canCheckout = canProceed !== false; // treat undefined as proceedable

  // ⚠️ FIXED: "checkout blocked" (blockedReason) and the create-order
  // failure (error, from useRazorpayCheckout) used to render as inline
  // page text sitting right above the Check Out button — per explicit
  // instruction, every error on this page should surface as the same
  // toast the rest of the app uses (ErrorToast) instead, never inline.
  // (The amber `notices` block further up is real business info from the
  // preview API — proration terms, etc. — not an error, so it's untouched.)
  useEffect(() => {
    if (!canCheckout && blockedReason) {
      setToastError({ message: blockedReason });
    } else if (error && paymentState === "idle") {
      setToastError({ message: error });
    }
  }, [blockedReason, canCheckout, error, paymentState]);

  return (
    <>
      <div className="sticky top-4 self-start overflow-hidden rounded-xl bg-white ring-1 ring-gray-200/70 dark:bg-gray-800 dark:ring-gray-700">
        <header className="flex items-center gap-2.5 px-5 pb-1 pt-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ReceiptText size={16} aria-hidden="true" />
          </span>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
        </header>

        <div className="px-5 pt-3">
        <div className="mb-3">
          {/* plan.strikePrice (confirmed field, e.g. 4000) is a separate,
              larger number from the ORIGINAL_PRICE row below (confirmed to
              be plan.price, e.g. 1999) — it never appears in
              orderSummary.rows at all, so it's rendered here as its own
              row rather than overwriting/relabeling ORIGINAL_PRICE. Shown
              as-is, no discountPercent/discountAmount math involved. */}
          {plan?.strikePrice != null && plan.strikePrice > (plan?.price ?? 0) && (
            <SummaryRow label="Strike Price" value={formatINR(plan.strikePrice)} muted strike />
          )}
          {rows
            // Skip the separate "Discount (X% off)" line item — that
            // saving is already visible from the strike-through rows above
            // + the "You saved" text. A user-applied promo-code row
            // ("Promo code (CODE)") isn't caught by this — it's a
            // different, action-driven discount and still shows normally.
            .filter((row) => !/^discount\s*\(/i.test(row.label || ""))
            .map((row) => {
              // The backend has sent this row under more than one label
              // ("Trydood Discount", "Promo code (CODE)") — match either so
              // the code + Remove control reliably attaches to it.
              const isDiscountRow = /discount|promo/i.test(row.label || "");
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
            so this prompt hides (it duplicated that row otherwise) and
            comes back once the code is removed. */}
        {promo?.supported && !pricing?.promoCode && (
          <PromoCodePanel
            onApply={onApplyPromo}
            applying={applyingPromo}
            initialOpen={promoJustRemoved}
            error={promoError}
          />
        )}
        {!promo?.supported && (
          <p className="mb-5 text-sm text-gray-500">
            {promo?.message || "Have a promo code? Coming soon."}
          </p>
        )}

        {payable && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3.5 dark:bg-emerald-500/10">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{payable.label}</span>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">{payable.display}</span>
            </div>
            {orderSummary?.savedText && (
              <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{orderSummary.savedText}</p>
            )}
          </div>
        )}

        {canCheckout && billingAddressRequired && (
          <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Save your billing address first — it&apos;s printed on your invoice.
          </p>
        )}
        {canCheckout ? (
          <button
            onClick={handleCheckout}
            disabled={processing || paymentState === "processing" || billingAddressRequired}
            className="mb-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#09B285] to-[#0F0E20] text-base font-bold text-white shadow-sm transition-all duration-150 hover:from-[#07a077] hover:to-[#1a1a3e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={16} aria-hidden="true" />
            {requiresPayment === false
              ? processing || paymentState === "processing" ? "Activating your plan…" : "Activate Plan"
              : processing || paymentState === "processing" ? "Opening secure checkout…" : "Check Out"}
          </button>
        ) : (
          // canProceed:false means the backend already considers this
          // handled (e.g. already paid/subscribed) — don't let Checkout
          // keep hitting create-order in that state, just move the vendor
          // forward instead: the dashboard, or during onboarding the
          // server's current screen.
          <button
            type="button"
            onClick={() => (returnTo || isOnboardingCompleteNow() ? navigate("/analysis-report") : goToServerScreen(null))}
            className="mb-3 min-h-12 w-full rounded-xl bg-emerald-600 text-base font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.99]"
          >
            Continue
          </button>
        )}

        </div>
        <div className="flex items-start gap-2.5 bg-gray-50/70 px-5 py-3 dark:bg-gray-900/30">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">100% secure payment</p>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400">Cards, UPI and Netbanking accepted.</p>
          </div>
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
          returnTo={returnTo}
        />
      )}

      <ErrorToast error={toastError} onDismiss={() => setToastError(null)} />
    </>
  );
}