// Onboarding v3 — the ONLY place the screen order lives. The sidebar,
// header breadcrumb, progress, next / back / skip all derive from this.
// Components are mapped separately (stepComponents.jsx) so this file stays
// plain data and can be imported anywhere without circular imports.
//
// Screens with a `route` are separate pages (plan, checkout, outlet …).
// They sit in the list so the sidebar and progress cover the whole journey;
// reaching one navigates to its page instead of rendering inside the shell.

import { ONBOARDING_ROUTES } from "./routes";

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
  PLAN: "PLAN",
  PAYMENT: "PAYMENT",
  OUTLET: "OUTLET",
});

// Business status picked on screen 05 — decides the Step 2 path.
export const BRANCHES = Object.freeze({
  GST: "gst",
  REG_NO_GST: "regnogst",
  UNREGISTERED: "unregistered",
});

/**
 * @typedef {Object} FlowScreen
 * @property {string} id
 * @property {string} title       - header breadcrumb label
 * @property {string|null} sub    - sidebar sub-step it belongs to (null = none)
 * @property {string[]} [branches] - only shown on these branches
 * @property {string} [reviewOf]  - review screen of another; skipped with it
 * @property {boolean} [skippable]
 * @property {boolean} [isNew]    - "New" badge in the sidebar
 * @property {string} [route]     - separate page instead of a shell screen
 */

/**
 * @typedef {Object} FlowGroup
 * @property {string} id
 * @property {string} label
 * @property {FlowScreen[]} screens
 */

const REGISTERED = [BRANCHES.GST, BRANCHES.REG_NO_GST];

/** @type {FlowGroup[]} */
export const FLOW_GROUPS = [
  {
    id: "basics",
    label: "Basic Details",
    screens: [
      { id: SCREENS.BRAND_NAME, title: "Brand Name", sub: "Brand Name" },
      { id: SCREENS.CATEGORY, title: "Category", sub: "Category" },
      { id: SCREENS.BUSINESS_STATUS, title: "Business Status", sub: "Business Status", isNew: true },
    ],
  },
  {
    id: "verification",
    label: "Business Verification",
    screens: [
      { id: SCREENS.GST_ENTER, title: "GSTIN", sub: "GSTIN", branches: [BRANCHES.GST] },
      { id: SCREENS.GST_REVIEW, title: "GST Review", sub: "GST Review", branches: [BRANCHES.GST], reviewOf: SCREENS.GST_ENTER },
      { id: SCREENS.PAN_ENTER, title: "Business PAN", sub: "Business PAN", branches: [BRANCHES.REG_NO_GST] },
      { id: SCREENS.PAN_REVIEW, title: "PAN Review", sub: "PAN Review", branches: [BRANCHES.REG_NO_GST], reviewOf: SCREENS.PAN_ENTER },
      // Business entity is on every path (pre-selected from GST / PAN / "not
      // registered"); on each path it comes right after the PAN review.
      { id: SCREENS.BUSINESS_TYPE, title: "Business Entity", sub: "Business Entity", branches: [BRANCHES.REG_NO_GST] },
      // The registered-no-GST path already verified a PAN, so only the GST path asks for the owner's.
      { id: SCREENS.OWNER_PAN, title: "Business PAN", sub: "Business PAN", branches: [BRANCHES.GST] },
      { id: SCREENS.OWNER_PAN_REVIEW, title: "PAN Review", sub: "PAN Review", branches: [BRANCHES.GST], reviewOf: SCREENS.OWNER_PAN },
      { id: SCREENS.BUSINESS_TYPE, title: "Business Entity", sub: "Business Entity", branches: [BRANCHES.GST] },
      { id: SCREENS.OWNER_KYC, title: "Owner Verification", sub: "Owner Verification", isNew: true, branches: [BRANCHES.UNREGISTERED] },
      // Same enter → review pattern as GSTIN / PAN: the owner's details are saved from the review.
      { id: SCREENS.OWNER_KYC_REVIEW, title: "Owner Review", sub: "Owner Review", branches: [BRANCHES.UNREGISTERED], reviewOf: SCREENS.OWNER_KYC },
      { id: SCREENS.BUSINESS_TYPE, title: "Business Entity", sub: "Business Entity", branches: [BRANCHES.UNREGISTERED] },
      { id: SCREENS.DOCUMENTS, title: "Business Documents", sub: "Business Documents", skippable: true },
    ],
  },
  {
    id: "payout",
    label: "Payout",
    screens: [
      { id: SCREENS.BANK_ENTER, title: "Bank Details", sub: "Bank Details", skippable: true },
      { id: SCREENS.BANK_REVIEW, title: "Review", sub: "Review", reviewOf: SCREENS.BANK_ENTER },
    ],
  },
  {
    id: "agreement",
    label: "Agreement & Plan",
    screens: [
      { id: SCREENS.PARTNER_CONTRACT, title: "Partner Contract", sub: "Partner Contract" },
      { id: SCREENS.PLAN, title: "Plan", sub: "Plan", route: ONBOARDING_ROUTES.PLAN },
      { id: SCREENS.PAYMENT, title: "Payment", sub: "Payment", route: ONBOARDING_ROUTES.CHECKOUT },
    ],
  },
  {
    id: "outlet",
    label: "Brand Outlet",
    screens: [{ id: SCREENS.OUTLET, title: "Brand Outlet", sub: null, route: ONBOARDING_ROUTES.OUTLET }],
  },
];

export const TOTAL_GROUPS = FLOW_GROUPS.length;

// Until the vendor picks a business status the flow is shown as the GST
// path (the design's default selection).
export const resolveBranch = (branch) => branch ?? BRANCHES.GST;

/**
 * The screens this vendor walks through, in order, for their branch.
 * @param {string|null} branch
 * @returns {(FlowScreen & { groupId: string, groupIndex: number })[]}
 */
export function getFlowScreens(branch) {
  const active = resolveBranch(branch);
  return FLOW_GROUPS.flatMap((group, groupIndex) =>
    group.screens
      .filter((screen) => !screen.branches || screen.branches.includes(active))
      .map((screen) => ({ ...screen, groupId: group.id, groupIndex })),
  );
}

export const isRegisteredBranch = (branch) => REGISTERED.includes(resolveBranch(branch));
