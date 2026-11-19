// Onboarding v2 → backend (API doc #20a–#32b). Every function returns the
// server envelope `{ success, message, data }`; errors are ApiError with
// `details.code` (services/http/apiError.js).

import { useAuthStore } from "@/features/onboarding/store/authStore";
import { request } from "@/features/onboarding/services/api/client";
import {
  updateBusinessEntityType,
  updateBusinessName,
  updateRegistrationStatus,
} from "@/features/onboarding/services/api/brand.api";
import {
  acknowledgeApproval,
  verifyBank,
  verifyGST,
  verifyPAN,
} from "@/features/onboarding/services/api/verify.api";
import {
  submitVerifiedBankDetails,
  submitVerifiedGstDetails,
  submitVerifiedPanDetails,
} from "@/features/onboarding/services/api/verificationDetails.api";
import { BRANCHES } from "../config/onboardingFlow";

const IFSC_LOOKUP_URL = "https://ifsc.razorpay.com";

/** The verify endpoints wrap their result in `data`; unwrap once. */
const unwrap = (res) => res?.data ?? res;

const currentBrandId = () => useAuthStore.getState().user?.brandId;

// ── Status (the only routing read) ────────────────────────────────────────

/** GET /brands/onboarding/status (#20a). @returns {Promise<{ data: import('../types').OnboardingStatus }>} */
export const getOnboardingStatus = () => request("/brands/onboarding/status", "GET", null, true);

/** GET /brands/get (#31) — saved brand details for previews. */
export const getBrand = () => request("/brands/get", "GET", null, true);

/** GET /brands/onboarding/documents (#23b). @returns {Promise<{ data: import('../types').DocumentsList }>} */
export const getKycDocuments = () => request("/brands/onboarding/documents", "GET", null, true);

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

/**
 * Brand + legal name. The legal name is only known after GST / PAN / owner
 * PAN is verified, so this is sent from those review screens, not screen 03.
 * @param {{ legalName: string, brandName: string }} names
 */
export const saveBusinessNames = ({ legalName, brandName }) =>
  updateBusinessName({ legalBusinessName: legalName, brandName });

/**
 * The backend knows REGISTERED / UNREGISTERED only; "registered, no GST"
 * is REGISTERED with no GST record.
 * @param {string} branch - BRANCHES value
 */
export const saveBusinessStatus = (branch) =>
  updateRegistrationStatus({ status: branch === BRANCHES.UNREGISTERED ? "UNREGISTERED" : "REGISTERED" });

/** @param {string} entityType - PROPRIETORSHIP | PARTNERSHIP | LLP | PRIVATE_LIMITED | … */
export const saveEntityType = (entityType) => updateBusinessEntityType({ entityType });

// ── Step 2 · Verification ─────────────────────────────────────────────────

/** @param {string} gstin @returns {Promise<object>} GST record */
export const fetchGstDetails = async (gstin) => unwrap(await verifyGST(gstin));

/** @param {string} pan @returns {Promise<object>} PAN record */
export const fetchPanDetails = async (pan) => unwrap(await verifyPAN(pan));

/** Saves a verified PAN record on the brand. @param {object} panDetails */
export const saveVerifiedPan = (panDetails) => submitVerifiedPanDetails(currentBrandId(), panDetails);

/** Saves a verified GST record on the brand. @param {object} gstDetails */
export const saveVerifiedGst = (gstDetails) => submitVerifiedGstDetails(gstDetails);

// GST "constitution of business" → the backend's businessEntityType.
const CONSTITUTION_TO_ENTITY = [
  ["proprietor", "PROPRIETORSHIP"],
  ["limited liability", "LLP"],
  ["partnership", "PARTNERSHIP"],
  ["one person", "ONE_PERSON_COMPANY"],
  ["private limited", "PRIVATE_LIMITED"],
  ["public limited", "PUBLIC_LIMITED"],
  ["trust", "TRUST"],
  ["society", "SOCIETY"],
];

/** @param {string} [constitution] @returns {string} */
export function entityTypeFromConstitution(constitution = "") {
  const value = constitution.toLowerCase();
  return CONSTITUTION_TO_ENTITY.find(([keyword]) => value.includes(keyword))?.[1] || "OTHERS";
}

// PAN 4th letter → entity type (P = personal PAN → run by one owner). Every
// valid letter maps to something, so a type is always pre-selected.
const PAN_LETTER_TO_ENTITY = {
  P: "PROPRIETORSHIP",
  C: "PRIVATE_LIMITED",
  F: "PARTNERSHIP",
  T: "TRUST",
  A: "OTHERS",
  B: "OTHERS",
  H: "OTHERS",
  G: "OTHERS",
  L: "OTHERS",
  J: "OTHERS",
};

/** @param {string} pan @returns {string|null} */
export const entityTypeFromPan = (pan = "") => PAN_LETTER_TO_ENTITY[pan.charAt(3).toUpperCase()] || null;

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

/** ₹1 penny-drop. @param {{ accountNumber: string, ifsc: string }} bank */
export const verifyBankAccount = (bank) => verifyBank(bank);

/**
 * @param {object} bankDetails - verifyBankAccount() result
 * @param {{ enteredAccountNumber: string, accountType: string }} extra
 */
export const saveVerifiedBank = (bankDetails, extra) => submitVerifiedBankDetails(bankDetails, extra);

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
 * POST /brands/onboarding/submit (#24) — replaced GET system-verify. Used for
 * the resubmit after a rejection; the review page's first submit is Milestone B.
 */
export const submitOnboarding = () => request("/brands/onboarding/submit", "POST", null, true);

export const acknowledgeBrandApproval = () => acknowledgeApproval();
