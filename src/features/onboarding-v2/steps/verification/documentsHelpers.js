import { KYC_PATHS } from "../../config/screens";

// Copy for the business-documents editor. What to upload is suggested by the
// server's `hints` chips (GET /brands/onboarding/documents) — no local
// per-category document lists (owner answer 5).

/**
 * @param {string|null} kycPath
 * @returns {string}
 */
export function documentsSubtitle(kycPath) {
  if (kycPath === KYC_PATHS.UNREGISTERED) {
    return "Licence and shop proof help us approve you faster. Your owner ID is already in Owner verification.";
  }
  return "Add the licences and registration proof you have. Give each one a title so our team knows what it is.";
}
