// ─────────────────────────────────────────────────────────────────────────────
// services/api/verify.api.js
// CGPEY third-party verification APIs + System verification
//
// Required .env variables:
//   VITE_CGPEY_BASE_URL=https://verify.cgpey.com/api/v1/verify
//   VITE_CGPEY_MERCHANT_ID=<your-merchant-id>
//   VITE_CGPEY_API_KEY=<your-api-key>
//   VITE_CGPEY_SECRET_KEY=<your-secret-key>
//
// BASE_URL for main backend comes from client.js — no env needed here.
// ─────────────────────────────────────────────────────────────────────────────

import { getToken } from "./client";
import { BASE_URL } from "../../../../config";

// ── CGPEY environment variables ───────────────────────────────────────────────
const CGPEY_BASE = import.meta.env.VITE_CGPEY_BASE_URL;
const CGPEY_MERCHANT_ID = import.meta.env.VITE_CGPEY_MERCHANT_ID;
const CGPEY_API_KEY = import.meta.env.VITE_CGPEY_API_KEY;
const CGPEY_SECRET_KEY = import.meta.env.VITE_CGPEY_SECRET_KEY;

// ── Credential guard ──────────────────────────────────────────────────────────
function assertCredentials() {
  const missing = [];
  if (!CGPEY_MERCHANT_ID) missing.push("VITE_CGPEY_MERCHANT_ID");
  if (!CGPEY_API_KEY) missing.push("VITE_CGPEY_API_KEY");
  if (!CGPEY_SECRET_KEY) missing.push("VITE_CGPEY_SECRET_KEY");
  if (missing.length) {
    throw new Error(
      `Missing CGPEY credentials in .env: ${missing.join(", ")}.\n` +
        `Ensure the VITE_ prefix is present and the dev server was restarted.`,
    );
  }
}

// ── CGPEY request (third-party) ───────────────────────────────────────────────
async function cgpeyRequest(endpoint, body) {
  const token = getToken();
  if (!token) throw new Error("Session expired. Please log in again.");

  assertCredentials();

  const base = CGPEY_BASE.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${path}`;

  let res;
  try {
    res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-merchant-id": CGPEY_MERCHANT_ID,
        "x-api-key": CGPEY_API_KEY,
        "x-secret-key": CGPEY_SECRET_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error. Please check your internet connection.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!res.ok) {
    if (Array.isArray(data?.error)) throw new Error(data.error.join(", "));
    throw new Error(
      data?.message || data?.error || `Error ${res.status}: ${res.statusText}`,
    );
  }

  return data;
}

// ── Main backend request helper ───────────────────────────────────────────────
// Uses BASE_URL from client.js — single source of truth, same as every other
// onboarding fetch in the codebase.
//
// BASE_URL = 'https://backend2-0-4v4i.onrender.com/trydood/v1'  (no trailing slash)
// path     = 'brands/onboarding/system-verify'                   (no leading slash)
// Result   → https://backend2-0-4v4i.onrender.com/trydood/v1/brands/onboarding/system-verify ✅
async function backendRequest(path, { method = "GET", body } = {}) {
  const token = getToken();
  if (!token) throw new Error("Session expired. Please log in again.");

  const base = BASE_URL.replace(/\/$/, ""); // strip any accidental trailing slash
  const clean = path.replace(/^\//, ""); // strip any leading slash
  const fullUrl = `${base}/${clean}`;

  let res;
  try {
    res = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Network error. Please check your internet connection.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!res.ok) {
    if (Array.isArray(data?.error)) throw new Error(data.error.join(", "));
    const err = new Error(
      data?.message || data?.error || `Error ${res.status}: ${res.statusText}`,
    );
    err.status = res.status;
    err.responseData = data;
    throw err;
  }

  return data;
}

// ── PAN Verification ──────────────────────────────────────────────────────────
export async function verifyPAN(pan) {
  if (!pan || typeof pan !== "string")
    throw new Error("PAN must be a non-empty string.");
  const normalized = pan.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized))
    throw new Error("Invalid PAN format. Expected format: AAKCT3750H");
  return cgpeyRequest("/pan", { pan: normalized });
}

// ── GST Verification ──────────────────────────────────────────────────────────
export async function verifyGST(gstin) {
  if (!gstin || typeof gstin !== "string")
    throw new Error("GSTIN must be a non-empty string.");
  const normalized = gstin.trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalized))
    throw new Error("Invalid GSTIN format. Expected format: 27ABCDE1234F1Z5");
  return cgpeyRequest("/gst", { gstNumber: normalized });
}

// ── Bank Verification ─────────────────────────────────────────────────────────
export async function verifyBank({ accountNumber, ifsc }) {
  if (!accountNumber || typeof accountNumber !== "string")
    throw new Error("accountNumber must be a non-empty string.");
  if (!ifsc || typeof ifsc !== "string")
    throw new Error("IFSC must be a non-empty string.");

  const normalizedIFSC = ifsc.trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIFSC))
    throw new Error("Invalid IFSC format. Expected format: SBIN0001234");

  return cgpeyRequest("/bank", {
    accountNumber: accountNumber.trim(),
    ifscCode: normalizedIFSC,
  });
}

// ── System Verification ───────────────────────────────────────────────────────
// POST /brands/onboarding/system-verify
// No body needed — backend derives brandId from JWT token.
//
// Response shape:
// {
//   success: true,
//   data: {
//     score: 65,
//     status: "APPROVED" | "REVIEW" | "REJECTED",
//     flags: { panVerified, gstVerified, bankVerified, bankMatched, gstActive,
//              panMatchedWithGST, panMatchedWithBrand, gstMatchedWithBrand,
//              businessEntityMatched, duplicatePAN, duplicateGST, duplicateBank,
//              duplicateWhatsapp, duplicateEmail },
//     nameMatch:     { panGstScore, panBrandScore, gstBrandScore, averageScore },
//     bankNameMatch: { bankPanScore, bankGstScore, bankBrandScore, highestScore },
//     entityMatch:   { gstConstitution, brandEntityType, matched },
//     duplicateDetails: { panBrandIds, gstBrandIds, bankBrandIds, whatsappBrandIds, emailBrandIds },
//     remarks: ["Bank holder name mismatch (11%)", ...]
//   }
// }

/**
 * Trigger system-level cross-verification after PAN + GST + Bank are saved.
 *
 * @returns {Promise<object>} Full API response
 * @example
 *   const res = await systemVerify();
 *   const { score, status, flags, remarks } = res.data;
 */
export async function systemVerify() {
  return backendRequest("brands/onboarding/system-verify", { method: "GET" });
}
