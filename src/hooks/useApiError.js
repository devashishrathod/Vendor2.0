// src/hooks/useApiError.js
export function parseApiError(errData) {
  const msg = errData?.message;
  const errorObj = errData?.error;

  // ── humanMessage — har possible path try karo ──
  let humanMessage = "Something went wrong. Please try again.";

  if (typeof msg === "string" && msg.trim()) {
    humanMessage = msg;
  } else if (
    msg &&
    typeof msg === "object" &&
    typeof msg.message === "string"
  ) {
    humanMessage = msg.message; // ← GST/PAN nested: message.message
  } else if (
    errorObj &&
    typeof errorObj.message === "object" &&
    typeof errorObj.message.message === "string"
  ) {
    humanMessage = errorObj.message.message; // ← error.message.message
  } else if (errorObj && typeof errorObj.message === "string") {
    humanMessage = errorObj.message; // ← error.message string
  }

  // ── txnId ──
  const txnId =
    errorObj?.transactionId ||
    errorObj?.clientRefNum ||
    errData?.requestId ||
    (msg && typeof msg === "object" ? msg.tranx_id : null) ||
    null;

  return { humanMessage, txnId };
}
