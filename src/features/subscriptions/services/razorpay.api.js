// ─────────────────────────────────────────────────────────────────────────────
// services/api/razorpay.api.js
// All Razorpay payment related API calls.
//
// IMPORTANT: signature verification must happen on your server (it needs the
// Razorpay *key secret*, which must never live in frontend code). This file
// only talks to your own backend, which in turn talks to Razorpay.
// ─────────────────────────────────────────────────────────────────────────────

import { request } from "@/services/api/client";

/**
 * Create a Razorpay order for a subscription purchase.
 * POST {{TryDood2.0BaseUrl}}/transactions/subscribe/create-order
 *
 * @param {{
 *   subscriptionId: string,   // required — the plan's _id
 *   email?: string,           // optional
 *   whatsappNumber?: string,  // optional
 *   amount?: number,          // optional — backend falls back to the plan's price if omitted
 *   currency?: string,        // optional — defaults to "INR"
 * }} payload
 *
 * @example
 * const { data } = await razorpayAPI.createOrder({
 *   subscriptionId: plan.id,
 *   email: billingDetails?.email,
 *   whatsappNumber: billingDetails?.phone,
 * });
 * // Confirmed response shape: data.razorpay.{orderId, amount (paise),
 * // currency, keyId}, data.transaction._id, plus billingDetails/
 * // orderSummary/plan/pricing/reused — used to open the Razorpay widget
 * // (see useRazorpayCheckout.js).
 */
export const createOrder = ({ subscriptionId, email, whatsappNumber, amount, currency = "INR" }) => {
  const payload = { subscriptionId, currency };
  if (email) payload.email = email;
  if (whatsappNumber) payload.whatsappNumber = whatsappNumber;
  if (amount !== undefined) payload.amount = amount;

  return request("/transactions/subscribe/create-order", "POST", payload, true);
};

/**
 * Verify a completed Razorpay payment (signature check happens server-side).
 * POST {{TryDood2.0BaseUrl}}/transactions/subscribe/verify-transaction
 *
 * @param {{
 *   razorpayPaymentId: string,  // required — from Razorpay checkout response
 *   razorpayOrderId: string,    // required — from Razorpay checkout response
 *   razorpaySignature: string,  // required — from Razorpay checkout response
 *   transactionId: string,      // required — createOrder's `data.transaction._id`
 * }} payload
 * @example
 * await razorpayAPI.verifyPayment({
 *   razorpayPaymentId: response.razorpay_payment_id,
 *   razorpayOrderId: response.razorpay_order_id,
 *   razorpaySignature: response.razorpay_signature,
 *   transactionId: order.transaction?._id, // captured from the createOrder response
 * });
 */
export const verifyPayment = ({
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  transactionId,
}) =>
  request(
    "/transactions/subscribe/verify-transaction",
    "POST",
    { razorpayPaymentId, razorpayOrderId, razorpaySignature, transactionId },
    true
  );

const razorpayAPI = { createOrder, verifyPayment };
export default razorpayAPI;