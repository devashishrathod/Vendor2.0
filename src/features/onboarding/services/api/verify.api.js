import { request } from "./client";

// PAN Verification
export async function verifyPAN(pan) {
  return request(
    "/verification/brands/onboarding/verify-pan",
    "POST",
    { pan },
    true
  );
}

// GST Verification
export async function verifyGST(gstin) {
  return request(
    "/verification/brands/onboarding/verify-gst",
    "POST",
    { gstNumber: gstin },
    true
  );
}

// Bank Verification
// beneficiaryName (optional, 3–100 chars) is what the backend name-matches
// the account holder against — it feeds the bankMatched flag (API doc #30).
export async function verifyBank({ accountNumber, ifsc, beneficiaryName }) {
  return request(
    "/verification/brands/onboarding/verify-bank",
    "POST",
    {
      accountNumber,
      ifscCode: ifsc,
      ...(beneficiaryName ? { beneficiaryName } : {}),
    },
    true
  );
}

// System Verify
export async function systemVerify() {
  return request(
    "/brands/onboarding/system-verify",
    "GET",
    null,
    true
  );
}

// Approve Partnership
export async function approvePartnership() {
  return request(
    "/brands/onboarding/accept-partnership",
    "PUT",
    null,
    true
  );
}

// Acknowledge Approval — called when the vendor clicks through to the
// dashboard from the Under Review page, once system-verify's status is
// APPROVED. No body.
export async function acknowledgeApproval() {
  return request(
    "/brands/onboarding/acknowledge-approval",
    "PUT",
    null,
    true
  );
}