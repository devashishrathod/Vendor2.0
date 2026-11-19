import { BRANCHES } from "../config/onboardingFlow";
import { SYSTEM_VERIFY_CACHE_KEY } from "../config/routes";

/**
 * @typedef {"pass"|"warn"|"fail"|"skipped"|"na"} CheckStatus
 * @typedef {{ key: string, label: string, status: CheckStatus, detail: string }} VerificationCheck
 * @typedef {"approved"|"review"|"failed"} VerificationOutcome
 * @typedef {{ score: number|null, remarks: string[] }} VerificationSummary
 */

// Score bands of GET /brands/onboarding/system-verify (docs/vendor_panel_api_doc.md #24):
// >= 90 APPROVED, >= 75 MANUAL_REVIEW, below that REJECTED.
export const SCORE_THRESHOLDS = Object.freeze({ APPROVE: 90, REVIEW: 75 });

// SYSTEM_VERIFICATION_STATUS → what the page shows.
const STATUS_OUTCOME = Object.freeze({
  APPROVED: "approved",
  MANUAL_REVIEW: "review",
  UNDER_REVIEW: "review",
  REVIEW: "review",
  PENDING: "review",
  REJECTED: "failed",
  REVOKED: "failed",
});

// ── Cached result (each call is a new attempt, so a refresh reuses it) ──

/** @returns {object|null} */
export function readCachedResult() {
  try {
    return JSON.parse(sessionStorage.getItem(SYSTEM_VERIFY_CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

/** @param {object} result */
export function writeCachedResult(result) {
  try {
    sessionStorage.setItem(SYSTEM_VERIFY_CACHE_KEY, JSON.stringify(result));
  } catch {
    /* storage full / blocked — the page still works without the cache */
  }
}

export function clearCachedResult() {
  try {
    sessionStorage.removeItem(SYSTEM_VERIFY_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** @param {number} ms */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The doc shows `remarks` as one string; older responses sent a list.
 * @param {unknown} remarks
 * @returns {string[]}
 */
export function normalizeRemarks(remarks) {
  if (Array.isArray(remarks)) return remarks.map(String).filter(Boolean);
  return remarks ? [String(remarks)] : [];
}

/**
 * @param {object} [result] - system-verify `data`
 * @returns {VerificationSummary}
 */
export const summarizeResult = (result = {}) => ({
  score: typeof result.score === "number" ? Math.max(0, Math.min(100, Math.round(result.score))) : null,
  remarks: normalizeRemarks(result.remarks),
});

/**
 * The checks to show, from the API flags. Things the vendor's path doesn't
 * need (GST on a no-GST path) are "na"; things they skipped (bank) are
 * "skipped" — neither is shown as a failure.
 * @param {object} [flags]
 * @param {unknown} [remarks]
 * @param {{ branch: string|null, bankSkipped: boolean }} options
 * @returns {VerificationCheck[]}
 */
export function buildChecks(flags = {}, remarks = [], { branch, bankSkipped }) {
  const remarkList = normalizeRemarks(remarks);
  const remark = (word) => remarkList.find((r) => r.toLowerCase().includes(word)) || null;
  // No local path (new device / after logout): go by what the backend verified.
  const hasGst = branch ? branch === BRANCHES.GST : Boolean(flags.gstVerified);
  const duplicate = flags.duplicatePAN || flags.duplicateGST || flags.duplicateBank || flags.duplicateWhatsapp;

  return [
    {
      key: "pan",
      label: "PAN verified",
      status: flags.panVerified ? "pass" : "fail",
      detail: flags.panVerified ? "Your PAN is valid and verified." : remark("pan") || "We couldn't verify your PAN.",
    },
    hasGst
      ? {
          key: "gst",
          label: "GST verified & active",
          status: !flags.gstVerified ? "fail" : !flags.gstActive ? "warn" : "pass",
          detail: !flags.gstVerified
            ? "GST couldn't be verified."
            : !flags.gstActive
              ? "Your GST registration isn't active."
              : "GSTIN is verified and active.",
        }
      : { key: "gst", label: "GST verified & active", status: "na", detail: "Not needed — you're registered without GST." },
    hasGst
      ? {
          key: "panGst",
          label: "PAN ↔ GST name match",
          status: flags.panMatchedWithGST ? "pass" : "warn",
          detail: flags.panMatchedWithGST
            ? "Names on PAN and GST match."
            : remark("name") || remark("pan") || "Names on PAN and GST don't fully match.",
        }
      : { key: "panGst", label: "PAN ↔ GST name match", status: "na", detail: "Not needed without GST." },
    bankSkipped
      ? { key: "bank", label: "Bank account", status: "skipped", detail: "You skipped bank details — add them to receive payouts." }
      : {
          key: "bank",
          label: "Bank account",
          status: !flags.bankVerified ? "fail" : !flags.bankMatched ? "warn" : "pass",
          detail: !flags.bankVerified
            ? "Bank account couldn't be verified."
            : !flags.bankMatched
              ? remark("bank") || "Account holder name doesn't match your business."
              : "Account holder matches your business.",
        },
    {
      key: "entity",
      label: "Business entity",
      status: flags.businessEntityMatched ? "pass" : "warn",
      detail: flags.businessEntityMatched
        ? "Matches your registration."
        : "Looks different from your registration.",
    },
    {
      key: "duplicate",
      label: "No duplicate accounts",
      status: duplicate ? "warn" : "pass",
      detail: duplicate ? remark("duplicate") || "These details are already used by another account." : "No other account uses these details.",
    },
  ];
}

/**
 * Backend status → outcome. An unknown or missing status is decided from
 * the checks themselves.
 * @param {string|undefined} status
 * @param {VerificationCheck[]} checks
 * @returns {VerificationOutcome}
 */
export function getOutcome(status, checks) {
  const mapped = STATUS_OUTCOME[status];
  if (mapped) return mapped;
  if (checks.some((c) => c.status === "fail")) return "failed";
  return checks.some((c) => c.status === "warn") ? "review" : "approved";
}

/** Whether any check itself failed or needs review. @param {VerificationCheck[]} checks */
export const hasCheckIssues = (checks) => checks.some((c) => c.status === "fail" || c.status === "warn");
