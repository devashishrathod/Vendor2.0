// Onboarding v2 → backend (API doc #20a–#32b). Every function returns the
// server envelope `{ success, message, data }`; errors are ApiError with
// `details.code` (services/http/apiError.js).

import { request, requestForm } from "@/features/onboarding/services/api/client";

const IFSC_LOOKUP_URL = "https://ifsc.razorpay.com";


// ── Status (the only routing read) ────────────────────────────────────────

/** GET /brands/onboarding/status (#20a). @returns {Promise<{ data: import('../types').OnboardingStatus }>} */
export const getOnboardingStatus = () => request("/brands/onboarding/status", "GET", null, true);

/** GET /brands/get (#31) — saved brand details for previews. */
export const getBrand = () => request("/brands/get", "GET", null, true);

/** GET /brands/onboarding/documents (#23b). @returns {Promise<{ data: import('../types').DocumentsList }>} */
export const getKycDocuments = () => request("/brands/onboarding/documents", "GET", null, true);

/**
 * POST /brands/onboarding/documents (#23c) — multipart `file` + `title`
 * (2–80) + `docType` only when picked from a hint chip (custom → server OTHER).
 * @param {{ title: string, docType?: string|null, file: File }} input
 * @returns {Promise<{ data: { document: import('../types').KycDocument, documentsStatus: string } }>}
 */
export function addKycDocument({ title, docType, file }) {
  const form = new FormData();
  form.append("title", title);
  if (docType) form.append("docType", docType);
  form.append("file", file);
  return requestForm("/brands/onboarding/documents", "POST", form);
}

/**
 * PUT /brands/onboarding/documents/:documentId (#23d) — rename and / or
 * replace. A new file comes back as a NEW `_id`.
 * @param {string} documentId
 * @param {{ title?: string, file?: File }} changes
 * @returns {Promise<{ data: { document: import('../types').KycDocument } }>}
 */
export function updateKycDocument(documentId, { title, file }) {
  const form = new FormData();
  if (title) form.append("title", title);
  if (file) form.append("file", file);
  return requestForm(`/brands/onboarding/documents/${encodeURIComponent(documentId)}`, "PUT", form);
}

/**
 * DELETE /brands/onboarding/documents/:documentId (#23e).
 * @param {string} documentId
 * @returns {Promise<{ data: { documentsStatus: string, count: number } }>}
 */
export const deleteKycDocument = (documentId) =>
  request(`/brands/onboarding/documents/${encodeURIComponent(documentId)}`, "DELETE", null, true);

// ── Step 1 · Basic Details ──────────────────────────────────────────────

/**
 * POST /brands/onboarding/add-basic-details (#20). `step` is the screen being
 * SAVED (not the next one); only that step's fields. Never sends
 * currentScreen or legalBusinessName — the server owns both.
 * @param {'BRAND_NAME'|'BUSINESS_CATEGORY'|'REGISTRATION_STATUS'|'REGISTRATION_ENTITY_TYPE'} step
 * @param {{ brandName?: string, categoryId?: string, subCategoryIds?: string[], kycPath?: string, businessEntityType?: string }} fields
 * @returns {Promise<{ data: { brand: object, currentScreen: string } }>}
 */
export const addBasicDetails = (step, fields) =>
  request("/brands/onboarding/add-basic-details", "POST", { step, ...fields }, true);

/**
 * PUT /brands/onboarding/update-basic-details (#27) — edits from the Basic
 * Details preview. At least one field; categoryId + subCategoryIds together.
 * The screen doesn't move, except a business-status switch before submit.
 * @param {{ brandName?: string, categoryId?: string, subCategoryIds?: string[], kycPath?: string, businessEntityType?: string }} fields
 * @returns {Promise<{ data: { brand: object, currentScreen: string } }>}
 */
export const editBasicDetails = (fields) => request("/brands/onboarding/update-basic-details", "PUT", fields, true);

// ── Step 2 · Business verification (paid verify → save by verificationId) ─

/**
 * POST /verification/brands/onboarding/verify-gst (#29) — PAID. Only on an
 * explicit "Verify" press, never retried; same GSTIN within the reuse window
 * comes back `reused: true` for free. A failed check is still 200 with
 * `isVerified: false` and the provider's `message`.
 * @param {string} gstNumber
 * @returns {Promise<{ data: import('../types').VerifyResult }>}
 */
export const verifyGst = (gstNumber) => request("/verification/brands/onboarding/verify-gst", "POST", { gstNumber }, true);

/**
 * POST /verification/brands/onboarding/verify-pan (#28) — PAID, same rules.
 * @param {string} pan
 * @returns {Promise<{ data: import('../types').VerifyResult }>}
 */
export const verifyPan = (pan) => request("/verification/brands/onboarding/verify-pan", "POST", { pan }, true);

/** POST /brands/onboarding/add-gst-details (#22). @param {string} verificationId @returns {Promise<{ data: import('../types').KycSaveResult }>} */
export const addGstDetails = (verificationId) => request("/brands/onboarding/add-gst-details", "POST", { verificationId }, true);

/** POST /brands/onboarding/add-pan-details (#21). @param {string} verificationId @returns {Promise<{ data: import('../types').KycSaveResult }>} */
export const addPanDetails = (verificationId) => request("/brands/onboarding/add-pan-details", "POST", { verificationId }, true);

/**
 * POST /brands/onboarding/skip (#23f) — KYC_DOCUMENTS, BANK_VERIFICATION or
 * BRAND_PROFESSIONAL_DETAILS, only on the vendor's current screen.
 * @param {string} screen
 * @returns {Promise<{ data: { currentScreen: string } }>}
 */
export const skipScreen = (screen) => request("/brands/onboarding/skip", "POST", { screen }, true);

/** POST /brands/onboarding/continue (#23g), no body. @returns {Promise<{ data: { currentScreen: string } }>} */
export const continueScreen = () => request("/brands/onboarding/continue", "POST", null, true);

/**
 * POST /brands/onboarding/owner-verification (#23a) — UNREGISTERED path.
 * PAN: JSON { method: "PAN", verificationId } after a verify-pan.
 * @param {string} verificationId
 * @returns {Promise<{ data: { ownerVerification: object, legalBusinessName: string, currentScreen: string } }>}
 */
export const saveOwnerPan = (verificationId) =>
  request("/brands/onboarding/owner-verification", "POST", { method: "PAN", verificationId }, true);

/**
 * Same route, ID document: multipart { method: "ID_DOCUMENT", idType, file }
 * (PDF, or JPG / PNG with a short side ≥ 800 px; max 5 MB).
 * @param {{ idType: AADHAAR|DRIVING_LICENCE|PASSPORT|VOTER_ID, file: File }} input
 */
export function saveOwnerIdDocument({ idType, file }) {
  const form = new FormData();
  form.append("method", "ID_DOCUMENT");
  form.append("idType", idType);
  form.append("file", file);
  return requestForm("/brands/onboarding/owner-verification", "POST", form);
}

// ── Step 3 · Payout ───────────────────────────────────────────────────────

/**
 * Public IFSC directory (no auth).
 * @param {string} ifsc
 * @returns {Promise<{ BANK: string, BRANCH: string, ADDRESS: string, CITY: string, STATE: string, MICR?: string }|null>}
 */
export async function lookupIfsc(ifsc) {
  const res = await fetch(`${IFSC_LOOKUP_URL}/${ifsc}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * POST /verification/brands/onboarding/verify-bank (#30) — PAID ₹1 penny
 * drop. Same account + IFSC within the reuse window is free (`reused`).
 * Never send `beneficiaryName` — the server matches the name itself (D114).
 * @param {{ accountNumber: string, ifscCode: string }} bank
 * @returns {Promise<{ data: import('../types').VerifyResult }>}
 */
export const verifyBankAccount = ({ accountNumber, ifscCode }) =>
  request("/verification/brands/onboarding/verify-bank", "POST", { accountNumber, ifscCode }, true);

/**
 * POST /brands/onboarding/add-bank-details (#23) — only the verificationId
 * (+ optional accountType); never isVerified or provider data.
 * @param {{ verificationId: string, accountType?: string }} input
 * @returns {Promise<{ data: import('../types').KycSaveResult }>}
 */
export const addBankDetails = ({ verificationId, accountType }) =>
  request("/brands/onboarding/add-bank-details", "POST", { verificationId, ...(accountType ? { accountType } : {}) }, true);

// ── Step 4 · Agreement ────────────────────────────────────────────────────

/**
 * PUT /brands/onboarding/accept-partnership (#25). On PARTNERSHIP_DEED it
 * accepts the deed and moves the screen; with deed.requiresDeedConfirmation
 * it confirms the admin's offline deed from any screen (screen unchanged).
 * @returns {Promise<{ data: { deed: import('../types').OnboardingDeed, currentScreen: string } }>}
 */
export const acceptPartnership = () => request("/brands/onboarding/accept-partnership", "PUT", null, true);

// ── Submit & after approval ───────────────────────────────────────────────

/**
 * POST /brands/onboarding/submit (#24), no body — the first submit from
 * ONBOARDING_REVIEW (→ UNDER_REVIEW), and the resubmit after a rejection /
 * revoke (screen stays). 422 ONBOARDING_STEP_INCOMPLETE `missing[]`,
 * 409 ONBOARDING_SCREEN_MISMATCH / ONBOARDING_LOCKED / LEGAL_FIELD_LOCKED.
 * @returns {Promise<{ data: { currentScreen: string, attemptNumber: number, submittedAt: string, systemChecks: import('../types').SystemCheck[] } }>}
 */
export const submitOnboarding = () => request("/brands/onboarding/submit", "POST", null, true);

/**
 * GET /brands/verifications/history (#33) — the review timeline, newest
 * first (SYSTEM_VERIFIED, RESUBMITTED, REJECTED, APPROVED, DETAIL_ADDED…).
 * @param {{ limit?: number }} [options]
 * @returns {Promise<object[]>}
 */
export async function getVerificationHistory({ limit = 50 } = {}) {
  const res = await request(`/brands/verifications/history?limit=${limit}&sortOrder=DESC`, "GET", null, true);
  return res?.data?.data ?? [];
}

/**
 * PUT /brands/onboarding/acknowledge-approval (#26), no body — "Continue" on
 * the congratulations screen (also after a re-approval, from DASHBOARD).
 * 400 not approved yet · 409 approval changed meanwhile (refresh).
 * @returns {Promise<{ data: { currentScreen: 'DASHBOARD', isApprovalAcknowledged: boolean } }>}
 */
export const acknowledgeBrandApproval = () => request("/brands/onboarding/acknowledge-approval", "PUT", null, true);
