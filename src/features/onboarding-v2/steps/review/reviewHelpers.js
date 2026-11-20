import { SCREENS } from "../../config/screens";
import { canRevisit } from "../../hooks/useOnboardingFlow";

/** The billing address section (not a server screen) on the review page. */
export const BILLING_SECTION = "BILLING_ADDRESS";

/** Where a submit `missing` code is fixed that isn't a wizard screen. */
export const FIX_TARGETS = Object.freeze({ BILLING: "BILLING", PLAN: "PLAN" });

/**
 * submit → 422 ONBOARDING_STEP_INCOMPLETE `missing` codes (guide §6, API doc #24).
 * `screen` = the wizard screen that fixes it; `target` = somewhere else.
 */
const MISSING_CODES = Object.freeze({
  BRAND_NAME: { label: "Brand name", screen: SCREENS.BRAND_NAME },
  CATEGORY: { label: "Category and sub-categories", screen: SCREENS.BUSINESS_CATEGORY },
  REGISTRATION: { label: "Business status", screen: SCREENS.REGISTRATION_STATUS },
  GST: { label: "GSTIN", screen: SCREENS.GST_VERIFICATION },
  PAN: { label: "PAN", screen: SCREENS.PAN_VERIFICATION },
  ENTITY: { label: "Business entity", screen: SCREENS.REGISTRATION_ENTITY_TYPE },
  OWNER_VERIFICATION: { label: "Owner verification", screen: SCREENS.OWNER_VERIFICATION },
  DEED: { label: "Partner contract", screen: SCREENS.PARTNERSHIP_DEED },
  BILLING_ADDRESS: { label: "Billing address", target: FIX_TARGETS.BILLING },
  LIVE_PLAN: { label: "An active plan", target: FIX_TARGETS.PLAN },
  LOGO: { label: "Brand logo", screen: SCREENS.BRAND_BASIC_DETAILS },
  EMAIL: { label: "Brand email", screen: SCREENS.BRAND_BASIC_DETAILS },
  MOBILE: { label: "Contact number", screen: SCREENS.BRAND_BASIC_DETAILS },
  OUTLET: { label: "At least one outlet", screen: SCREENS.OUTLET_DETAILS },
});

const OUTLET_MISSING = Object.freeze({
  OUTLET_NOT_VERIFIED: "manager's WhatsApp code",
  OUTLET_LOCATION: "location",
  OUTLET_WORK_HOURS: "work hours",
});

/**
 * @param {string[]} missing
 * @param {object[]} [outlets]  GET /subBrands/get-all — names the outlet in an `OUTLET_*:<id>` code
 * @returns {{ code: string, label: string, screen?: string, target?: string }[]}
 */
export function describeMissing(missing = [], outlets = []) {
  const outletName = (id) => {
    const index = outlets.findIndex((o) => o._id === id);
    if (index < 0) return "An outlet";
    const outlet = outlets[index];
    return `${outlet.outletType === "FRANCHISE" ? "Franchise" : "Outlet"} ${index + 1}${outlet.uniqueId ? ` (${outlet.uniqueId})` : ""}`;
  };
  return missing.map((code) => {
    const [prefix, id] = String(code).split(":");
    if (OUTLET_MISSING[prefix]) {
      return { code, label: `${outletName(id)}: ${OUTLET_MISSING[prefix]}`, screen: SCREENS.OUTLET_DETAILS };
    }
    return { code, ...(MISSING_CODES[code] ?? { label: code }) };
  });
}

/** `systemChecks[].key` → label + the section that fixes it (guide §6). */
export const SYSTEM_CHECKS = Object.freeze({
  GST_VERIFIED: { label: "GSTIN verified", screen: SCREENS.GST_VERIFICATION },
  GST_ACTIVE: { label: "GSTIN active", screen: SCREENS.GST_VERIFICATION },
  PAN_VERIFIED: { label: "PAN verified", screen: SCREENS.PAN_VERIFICATION },
  GST_PAN_NAME_MATCH: { label: "GST and PAN names match", screen: SCREENS.GST_VERIFICATION },
  BANK_VERIFIED: { label: "Bank account verified", screen: SCREENS.BANK_VERIFICATION },
  BANK_NAME_MATCH: { label: "Bank holder name matches", screen: SCREENS.BANK_VERIFICATION },
});

/** `profileStrength` item keys → the screen that adds them (guide §11). */
export const STRENGTH_ITEM_SCREENS = Object.freeze({
  LOGO: SCREENS.BRAND_BASIC_DETAILS,
  COVER_IMAGE: SCREENS.BRAND_BASIC_DETAILS,
  DESCRIPTION: SCREENS.BRAND_BASIC_DETAILS,
  SHOWCASE: SCREENS.BRAND_PROFESSIONAL_DETAILS,
  FEATURES: SCREENS.BRAND_PROFESSIONAL_DETAILS,
  OUTLET_READY: SCREENS.OUTLET_DETAILS,
  ALL_OUTLETS_COMPLETE: SCREENS.OUTLET_DETAILS,
  BANK: SCREENS.BANK_VERIFICATION,
  BUSINESS_PROOF: SCREENS.KYC_DOCUMENTS,
});

/** Strength points still on offer for a screen (the "+N" next to Add). */
export function pointsForScreen(screen, strength) {
  return (strength?.sections ?? [])
    .flatMap((s) => s.items ?? [])
    .filter((item) => STRENGTH_ITEM_SCREENS[item.key] === screen && item.available !== false && !item.done)
    .reduce((sum, item) => sum + (item.points ?? 0), 0);
}

/**
 * What a review section offers, from `status.editable` (guide §6 table):
 * `inline` (edits in its card), `open` (opens that screen, the server's
 * screen stays), `add` (a skipped item: open its screen to add it), or
 * `locked` (🔒, support changes it).
 * @param {string} screen
 * @param {import('../../types').OnboardingStatus} status
 * @returns {'inline'|'open'|'add'|'locked'}
 */
export function reviewAction(screen, status) {
  const editable = status?.editable ?? {};
  const kyc = editable.kyc ?? {};
  switch (screen) {
    case SCREENS.BRAND_NAME:
    case SCREENS.BUSINESS_CATEGORY:
      return editable.legal ? "inline" : "locked";
    case SCREENS.REGISTRATION_STATUS:
      return editable.registrationStatus && !status.registrationStatusLocked ? "inline" : "locked";
    case SCREENS.GST_VERIFICATION:
    case SCREENS.PAN_VERIFICATION:
      // Saved PAN / GST unlock only in remediation (`kyc.change`).
      return kyc.change ? "open" : "locked";
    case SCREENS.BANK_VERIFICATION:
      if (status.items?.bank !== "PROVIDED") return kyc.add?.bank ? "add" : "locked";
      return kyc.change ? "open" : "locked";
    case SCREENS.KYC_DOCUMENTS:
      if (status.items?.documents !== "PROVIDED" && editable.documents?.add) return "add";
      return canRevisit(screen, status) ? "open" : "locked";
    case BILLING_SECTION:
      return editable.billingAddress ? "inline" : "locked";
    default:
      return canRevisit(screen, status) ? "open" : "locked";
  }
}

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/** `verifications/history` actions → what the vendor reads (API doc #33). */
const HISTORY_LABELS = Object.freeze({
  SYSTEM_VERIFIED: "Submitted — system checks ran",
  RESUBMITTED: "Resubmitted",
  REJECTED: "Changes requested",
  APPROVED: "Approved",
  REVOKED: "Approval withdrawn",
  DETAIL_ADDED: "Detail added",
  DOCUMENT_REVIEWED: "Document reviewed",
  APPROVAL_ACKNOWLEDGED: "Welcome seen",
  DEED_ACCEPTED: "Partner contract accepted",
  DEED_CONFIRMED: "Partner contract confirmed",
});

/**
 * History rows → timeline entries (newest first). A REJECTED row carries the
 * reason the vendor must see.
 * @param {object[]} rows
 * @returns {{ id: string, label: string, when: string|null, note: string|null, attempt: number|null }[]}
 */
export function timelineEntries(rows = []) {
  return rows.map((row) => ({
    id: row._id,
    label: HISTORY_LABELS[row.action] ?? String(row.action ?? "").replaceAll("_", " ").toLowerCase(),
    when: formatDateTime(row.createdAt),
    // Stage rows carry `reason`; API doc #33 shows `rejectionReason`.
    note: row.rejectionReason || row.revokeReason || row.reason || null,
    attempt: row.attemptNumber ?? null,
  }));
}
