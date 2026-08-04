// ─────────────────────────────────────────────────────────────────────────────
// hooks/useRazorpayCheckout.js
// Drives the full client-side Razorpay flow:
//   1. load checkout.js (once, cached)
//   2. ask our backend to create a Razorpay order
//   3. open the Razorpay modal
//   4. on success, ask our backend to verify the signature
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import razorpayAPI from "@/features/subscriptions/services/razorpay.api";
// ─────────────────────────────────────────────────────────────────────────────
// hooks/useRazorpayCheckout.js
// Orchestrates the full subscription payment flow:
//   1. createOrder()      -> our backend creates a Razorpay order
//   2. open Razorpay widget with that order
//   3. on success, verifyPayment() -> our backend verifies the signature
// ─────────────────────────────────────────────────────────────────────────────



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

export function useRazorpayCheckout() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  /**
   * @param {{
   *   brandId: string,
   *   subscriptionId: string,          // plan._id
   *   businessDetails?: { brandName?: string, email?: string, phone?: string },
   *   onSuccess?: (verifyResult: any) => void,
   *   onFailure?: (err: Error) => void,
   * }} args
   */
  const pay = useCallback(async ({ brandId, subscriptionId, businessDetails = {}, onSuccess, onFailure }) => {
    setError("");
    setProcessing(true);
    try {
      await loadRazorpayScript();

      // 1. Create the order on our backend
      const orderRes = await razorpayAPI.createOrder({
        brandId,
        subscriptionId,
        email: businessDetails.email,
        whatsappNumber: businessDetails.phone,
      });
      console.log("Create Order Response:", orderRes);

      const order = orderRes?.data;
      if (!order?.razorpayOrderId) {
        throw new Error("Could not create payment order. Please try again.");
      }
      console.log("Order Data:", order);

      // 2. Open the Razorpay checkout widget
      return await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount * 100, // paise
          currency: order.currency || "INR",
          name: businessDetails.brandName || "Trydood",
          description: "Subscription payment",
          order_id: order.razorpayOrderId,
          prefill: {
            email: businessDetails.email,
            contact: order.contact || businessDetails.phone,
          },
          theme: { color: "#09B285" },
          handler: async (response) => {
            try {
              // 3. Verify the payment on our backend
              const verifyRes = await razorpayAPI.verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                transactionId: order._id,
              });
              setProcessing(false);
              onSuccess?.(verifyRes);
              resolve(verifyRes);
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

  return { pay, processing, error };
}