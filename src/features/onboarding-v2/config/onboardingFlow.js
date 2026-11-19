// Legacy local ids still used by screens not yet moved to the server's
// screens (config/screens.js). The screen order, groups, progress and next /
// back / skip are NOT here any more — they come from
// GET /brands/onboarding/status (store/statusStore.js).

export const SCREENS = Object.freeze({
  BRAND_NAME: "BRAND_NAME",
  CATEGORY: "CATEGORY",
  BUSINESS_STATUS: "BUSINESS_STATUS",
  GST_ENTER: "GST_ENTER",
  GST_REVIEW: "GST_REVIEW",
  PAN_ENTER: "PAN_ENTER",
  PAN_REVIEW: "PAN_REVIEW",
  BUSINESS_TYPE: "BUSINESS_TYPE",
  OWNER_PAN: "OWNER_PAN",
  OWNER_PAN_REVIEW: "OWNER_PAN_REVIEW",
  OWNER_KYC: "OWNER_KYC",
  OWNER_KYC_REVIEW: "OWNER_KYC_REVIEW",
  DOCUMENTS: "DOCUMENTS",
  BANK_ENTER: "BANK_ENTER",
  BANK_REVIEW: "BANK_REVIEW",
  PARTNER_CONTRACT: "PARTNER_CONTRACT",
});

// The outlet / remediation pages (Milestone B) still key their copy on these.
export const BRANCHES = Object.freeze({
  GST: "gst",
  REG_NO_GST: "regnogst",
  UNREGISTERED: "unregistered",
});

const KYC_PATH_TO_BRANCH = Object.freeze({
  GST: BRANCHES.GST,
  NO_GST: BRANCHES.REG_NO_GST,
  UNREGISTERED: BRANCHES.UNREGISTERED,
});

/**
 * The server's `kycPath` as the legacy branch id (null when not chosen yet).
 * @param {string|null|undefined} kycPath
 * @returns {string|null}
 */
export const branchFromKycPath = (kycPath) => KYC_PATH_TO_BRANCH[kycPath] ?? null;
