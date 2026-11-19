// Legacy branch ids for the outlet / remediation pages (Milestone B), which
// still key their copy on them. Screens, order, groups, progress and next /
// back / skip are NOT here — they come from GET /brands/onboarding/status
// (store/statusStore.js, config/screens.js).
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
