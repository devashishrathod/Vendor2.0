// ─────────────────────────────────────────────────────────────────────────────
// hooks/useRazorpayCheckout.js
// Orchestrates the full subscription payment flow:
//   1. createOrder()      -> our backend creates a Razorpay order
//      -> stored locally immediately (state + sessionStorage) so it's
//         available to WelcomePage even before payment finishes
//   2. open Razorpay widget with that order
//   3. on success, verifyPayment() -> our backend verifies the signature
//      -> result is MERGED into the stored order (not replacing it), since
//         verify-transaction only confirms status/paidAmount-type fields —
//         amount, invoiceId, contact, etc. all come from step 1
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import razorpayAPI from "@/features/subscriptions/services/razorpay.api";

// Loads the Razorpay checkout script once and caches the promise.
let razorpayScriptPromise = null;
function loadRazorpayScript() {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

const STORAGE_KEY = "trydood_pending_order";

function persistOrder(order) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // sessionStorage can throw in some private/incognito modes — not fatal,
    // React state below is still the source of truth for the current tab.
  }
}

export function useRazorpayCheckout() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  // The live order object — set the instant createOrder() resolves, then
  // updated (merged, not replaced) once verifyPayment() confirms. This is
  // what WelcomePage should render from.
  const [orderData, setOrderData] = useState(null);

  /**
   * @param {{
   *   subscriptionId: string,          // plan._id
   *   businessDetails?: { brandName?: string, email?: string, phone?: string },
   *   onSuccess?: (order: object) => void,   // receives the MERGED order object
   *   onFailure?: (err: Error) => void,
   * }} args
   */
  const pay = useCallback(async ({ subscriptionId, businessDetails = {}, onSuccess, onFailure }) => {
    setError("");
    setProcessing(true);
    try {
      await loadRazorpayScript();

      // 1. Create the order on our backend
      const orderRes = await razorpayAPI.createOrder({
        subscriptionId,
        email: businessDetails.email,
        whatsappNumber: businessDetails.phone,
      });
      console.log("Create Order Response:", orderRes);

      // Confirmed shape: { razorpay: { orderId, amount (paise), currency,
      // keyId }, transaction: { _id, ... }, billingDetails, orderSummary,
      // plan, pricing, reused }. There's no top-level razorpayOrderId/
      // amount/contact/_id — those were guessed before anyone had seen a
      // real response.
      const order = orderRes?.data;
      const razorpayOrder = order?.razorpay;
      if (!razorpayOrder?.orderId) {
        throw new Error("Could not create payment order. Please try again.");
      }
      console.log("Order Data:", order);

      // WelcomePage still reads a flat `orderData.amount` in rupees —
      // razorpay.amount comes back in paise, so derive that once here
      // rather than touching every downstream consumer.
      const orderForUi = { ...order, amount: razorpayOrder.amount / 100 };

      // Store it locally right away — before the Razorpay widget even opens.
      // WelcomePage can use this from the very first render if needed.
      setOrderData(orderForUi);
      persistOrder(orderForUi);

      // 2. Open the Razorpay checkout widget
      return await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: razorpayOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount, // already paise — don't multiply again
          currency: razorpayOrder.currency || "INR",
          name: businessDetails.brandName || "Trydood",
          description: "Subscription payment",
          order_id: razorpayOrder.orderId,
          prefill: {
            email: businessDetails.email,
            contact: businessDetails.phone,
          },
          theme: { color: "#09B285" },
          handler: async (response) => {
            try {
              // 3. Verify the payment on our backend
              const verifyRes = await razorpayAPI.verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                transactionId: order.transaction?._id,
              });
              console.log("Verify Payment Response:", verifyRes);

              // Merge, don't replace: keep every field from the original
              // create-order object (amount, billingDetails, ...) and
              // layer in whatever verify-transaction confirms changed
              // (status, paidAmount, verified, etc.).
              const merged = { ...orderForUi, ...(verifyRes?.data || {}) };

              setOrderData(merged);
              persistOrder(merged);
              setProcessing(false);
              onSuccess?.(merged);
              resolve(merged);
            } catch (verifyErr) {
              setProcessing(false);
              setError(verifyErr.message || "Payment verification failed.");
              onFailure?.(verifyErr);
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              // user closed the widget — not an error, just stop here
              resolve(null);
            },
          },
        });

        rzp.on("payment.failed", (resp) => {
          const err = new Error(resp?.error?.description || "Payment failed. Please try again.");
          setProcessing(false);
          setError(err.message);
          onFailure?.(err);
          reject(err);
        });

        rzp.open();
      });
    } catch (err) {
      setProcessing(false);
      setError(err.message || "Something went wrong. Please try again.");
      onFailure?.(err);
      throw err;
    }
  }, []);

  // Recover the last known order — e.g. if the page refreshed mid-flow.
  const getStoredOrder = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const clearStoredOrder = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setOrderData(null);
  }, []);

  return { pay, processing, error, orderData, getStoredOrder, clearStoredOrder };
}