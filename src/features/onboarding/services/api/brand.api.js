// ─────────────────────────────────────────────────────────────────────────────
// services/api/brand.api.js
// PUT /brands/onboarding/basic-details
// Handles all three onboarding screens with their respective bodies.
// ─────────────────────────────────────────────────────────────────────────────

import { request } from "./client";

const ENDPOINT = "/brands/onboarding/basic-details";

// ── Screen 1 — Business Name (Step3BusinessName) ──────────────────────────────
// currentScreen: "REGISTRATION_STATUS"
// Sends: legalBusinessName (required) + brandName / shortName (optional)
/**
 * @param {{ legalBusinessName: string, brandName?: string }} params
 */
export async function updateBusinessName({ legalBusinessName, brandName }) {
  const body = {
    currentScreen: "REGISTRATION_STATUS",
    legalBusinessName,
    ...(brandName?.trim() && { brandName: brandName.trim() }),
  };
  return request(ENDPOINT, "POST", body, true);
}

// ── Screen 2 — Registration Status (Step4IsRegistered) ────────────────────────
// currentScreen: "REGISTRATION_ENTITY_TYPE"
// Sends: businessRegistrationStatus — "REGISTERED" | "UNREGISTERED"
/**
 * @param {{ status: 'REGISTERED' | 'UNREGISTERED' }} params
 */
export async function updateRegistrationStatus({ status }) {
  const body = {
    currentScreen: "REGISTRATION_ENTITY_TYPE",
    businessRegistrationStatus: status,
  };
  return request(ENDPOINT, "POST", body, true);
}

// ── Screen 3 — Business Type (Step5BusinessType) ──────────────────────────────
// currentScreen: "BUSINESS_VERIFICATION"
// Sends: businessEntityType — one of:
//   PROPRIETORSHIP | PARTNERSHIP | LLP | PRIVATE_LIMITED |
//   PUBLIC_LIMITED | ONE_PERSON_COMPANY | TRUST | NGO | SOCIETY
/**
 * @param {{ entityType: string }} params
 */
export async function updateBusinessEntityType({ entityType }) {
  const body = {
    currentScreen: "PAN_VERIFICATION",
    businessEntityType: entityType,
  };
  return request(ENDPOINT, "POST", body, true);
}
