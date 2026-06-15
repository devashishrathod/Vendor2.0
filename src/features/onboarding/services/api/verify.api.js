// ─────────────────────────────────────────────────────────────────────────────
// services/api/verify.api.js
// CGPEY third-party verification APIs
// Base URL is different from main backend — uses its own endpoint
//
// Required .env variables (Vite projects must use the VITE_ prefix):
//
//   VITE_CGPEY_BASE_URL=https://verify.cgpey.com/api/v1/verify
//   VITE_CGPEY_MERCHANT_ID=<your-merchant-id>
//   VITE_CGPEY_API_KEY=<your-api-key>
//   VITE_CGPEY_SECRET_KEY=<your-secret-key>
//
// Place the .env file in your project root (same level as vite.config.js).
// Restart the dev server after editing .env for changes to take effect.
// Never commit .env to version control — add it to .gitignore.
// ─────────────────────────────────────────────────────────────────────────────

import { getToken } from './client';

// ── Environment variables ─────────────────────────────────────────────────────
const CGPEY_BASE        = import.meta.env.VITE_CGPEY_BASE_URL || 'https://verify.cgpey.com/api/v1/verify';
const CGPEY_MERCHANT_ID = import.meta.env.VITE_CGPEY_MERCHANT_ID;
const CGPEY_API_KEY     = import.meta.env.VITE_CGPEY_API_KEY;
const CGPEY_SECRET_KEY  = import.meta.env.VITE_CGPEY_SECRET_KEY;

// ── Credential guard ──────────────────────────────────────────────────────────
function assertCredentials() {
  const missing = [];
  if (!CGPEY_MERCHANT_ID) missing.push('VITE_CGPEY_MERCHANT_ID');
  if (!CGPEY_API_KEY)     missing.push('VITE_CGPEY_API_KEY');
  if (!CGPEY_SECRET_KEY)  missing.push('VITE_CGPEY_SECRET_KEY');

  if (missing.length) {
    throw new Error(
      `Missing CGPEY credentials in .env: ${missing.join(', ')}.\n` +
      `Ensure the VITE_ prefix is present and the dev server was restarted.`
    );
  }
}

// ── Core request helper ───────────────────────────────────────────────────────

/**
 * Core request for CGPEY — same pattern as client.js request()
 * Always requires auth token from localStorage + merchant credentials from env.
 *
 * @param {string} endpoint  - e.g. '/pan', '/gst', '/bank'
 * @param {object} body      - JSON payload
 * @returns {Promise<object>} - parsed response data
 */
async function cgpeyRequest(endpoint, body) {
  // 1. Auth token check
  const token = getToken();
  if (!token) throw new Error('Session expired. Please log in again.');

  // 2. Merchant credentials check
  assertCredentials();

  // 3. Ensure base URL has no trailing slash, endpoint has leading slash
  const base         = CGPEY_BASE.replace(/\/$/, '');
  const path         = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl      = `${base}${path}`;

  // 4. Make the request
  let res;
  try {
    res = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'x-merchant-id': CGPEY_MERCHANT_ID,
        'x-api-key':     CGPEY_API_KEY,
        'x-secret-key':  CGPEY_SECRET_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Please check your internet connection.');
  }

  // 5. Parse response
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid response from server.');
  }

  // 6. Handle HTTP errors
  if (!res.ok) {
    // Surface validation errors array if present (e.g. ["gstNumber is required"])
    if (Array.isArray(data?.error)) {
      throw new Error(data.error.join(', '));
    }
    throw new Error(data?.message || data?.error || `Error ${res.status}: ${res.statusText}`);
  }

  return data;
}

// ── PAN Verification ──────────────────────────────────────────────────────────
// POST /verify/pan
// Body: { pan: "AAKCT3750H" }

/**
 * Verify a PAN card number.
 *
 * @param {string} pan - 10-character PAN number (uppercase, e.g. "AAKCT3750H")
 * @returns {Promise<object>} - Full API response
 *
 * @example
 *   const result = await verifyPAN('AAKCT3750H');
 *   console.log(result.data.fullName); // "TRYDOOD RETAIL PRIVATE LIMITED"
 */
export async function verifyPAN(pan) {
  if (!pan || typeof pan !== 'string') {
    throw new Error('PAN must be a non-empty string.');
  }

  const normalized = pan.trim().toUpperCase();

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized)) {
    throw new Error('Invalid PAN format. Expected format: AAKCT3750H');
  }

  return cgpeyRequest('/pan', { pan: normalized });
}

// ── GST Verification ──────────────────────────────────────────────────────────
// POST /verify/gst
// Body: { gstNumber: "27ABCDE1234F1Z5" }   ← backend expects "gstNumber" (not "gstin")

/**
 * Verify a GST Identification Number (GSTIN).
 *
 * @param {string} gstin - 15-character GSTIN (uppercase, e.g. "27ABCDE1234F1Z5")
 * @returns {Promise<object>} - Full API response
 *
 * @example
 *   const result = await verifyGST('27ABCDE1234F1Z5');
 *   console.log(result.data.tradeName); // "ABC Traders"
 */
export async function verifyGST(gstin) {
  if (!gstin || typeof gstin !== 'string') {
    throw new Error('GSTIN must be a non-empty string.');
  }

  const normalized = gstin.trim().toUpperCase();

  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalized)) {
    throw new Error('Invalid GSTIN format. Expected format: 27ABCDE1234F1Z5');
  }

  // ✅ Key is "gstNumber" — backend rejects "gstin"
  return cgpeyRequest('/gst', { gstNumber: normalized });
}

// ── Bank Verification ─────────────────────────────────────────────────────────
// POST /verify/bank
// Body: { accountNumber, ifscCode }   ← only these two fields; beneficiaryName is NOT allowed

/**
 * Verify a bank account using account number and IFSC code.
 * Note: beneficiaryName is validated client-side only — do NOT send it to the API.
 *
 * @param {{ accountNumber: string, ifsc: string }} params
 * @returns {Promise<object>} - Full API response
 *
 * @example
 *   const result = await verifyBank({ accountNumber: '123456789012', ifsc: 'SBIN0001234' });
 *   console.log(result.result.account_holder_name); // "Deva"
 */
export async function verifyBank({ accountNumber, ifsc }) {
  if (!accountNumber || typeof accountNumber !== 'string') {
    throw new Error('accountNumber must be a non-empty string.');
  }

  if (!ifsc || typeof ifsc !== 'string') {
    throw new Error('IFSC must be a non-empty string.');
  }

  const normalizedIFSC = ifsc.trim().toUpperCase();

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIFSC)) {
    throw new Error('Invalid IFSC format. Expected format: SBIN0001234');
  }

  // ✅ Only accountNumber + ifscCode — beneficiaryName is NOT allowed by API
  return cgpeyRequest('/bank', {
    accountNumber: accountNumber.trim(),
    ifscCode:      normalizedIFSC,       // ← API expects "ifscCode" not "ifsc"
  });
}