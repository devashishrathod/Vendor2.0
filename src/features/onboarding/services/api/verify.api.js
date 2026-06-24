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
export async function verifyBank({ accountNumber, ifsc }) {
  return request(
    "/verification/brands/onboarding/verify-bank",
    "POST",
    {
      accountNumber,
      ifscCode: ifsc,
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