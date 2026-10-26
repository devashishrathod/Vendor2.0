// Onboarding v2 — the ONLY place the screen order lives. The sidebar,
// header breadcrumb, progress, next / back / skip all derive from this.
// Components are mapped separately (stepComponents.js) so this file stays
// plain data and can be imported anywhere without circular imports.

export const SCREENS = Object.freeze({
  BUSINESS_NAME: "BUSINESS_NAME",
  BUSINESS_CATEGORY: "BUSINESS_CATEGORY",
  REGISTRATION_STATUS: "REGISTRATION_STATUS",
  ENTITY_TYPE: "ENTITY_TYPE",
  PAN_VERIFICATION: "PAN_VERIFICATION",
  PAN_REVIEW: "PAN_REVIEW",
  GST_VERIFICATION: "GST_VERIFICATION",
  GST_REVIEW: "GST_REVIEW",
  BUSINESS_DOCUMENTS: "BUSINESS_DOCUMENTS",
  BANK_VERIFICATION: "BANK_VERIFICATION",
  BANK_REVIEW: "BANK_REVIEW",
  PARTNER_CONTRACT: "PARTNER_CONTRACT",
});

export const BRANCHES = Object.freeze({
  REGISTERED: "REGISTERED",
  UNREGISTERED: "UNREGISTERED",
});

// Where the vendor goes once the partner contract is accepted.
export const ONBOARDING_EXIT_ROUTE = "/subscription";

/**
 * @typedef {Object} FlowScreen
 * @property {string} id
 * @property {string} title       - header breadcrumb label
 * @property {string|null} sub    - sidebar sub-step it belongs to (null = none)
 * @property {string} [branch]    - only shown on this branch
 * @property {string} [reviewOf]  - review screen of another; skipped with it
 * @property {boolean} [skippable]
 * @property {boolean} [isNew]    - "New" badge in the sidebar
 */

/**
 * @typedef {Object} FlowGroup
 * @property {string} id
 * @property {string|Record<string,string>} label - per-branch when an object
 * @property {FlowScreen[]} screens
 */

/** @type {FlowGroup[]} */
export const FLOW_GROUPS = [
  {
    id: "basic",
    label: "Basic Details",
    screens: [
      { id: SCREENS.BUSINESS_NAME, title: "Business name", sub: "Business name" },
      { id: SCREENS.BUSINESS_CATEGORY, title: "Business category", sub: "Business category", isNew: true },
      { id: SCREENS.REGISTRATION_STATUS, title: "Registration status", sub: "Registration status" },
      { id: SCREENS.ENTITY_TYPE, title: "Business type", sub: "Business type", branch: BRANCHES.REGISTERED },
    ],
  },
  {
    id: "verification",
    label: {
      [BRANCHES.REGISTERED]: "Business Verification",
      [BRANCHES.UNREGISTERED]: "Business Documents",
    },
    screens: [
      { id: SCREENS.PAN_VERIFICATION, title: "PAN verification", sub: "PAN verification", branch: BRANCHES.REGISTERED, skippable: true },
      { id: SCREENS.PAN_REVIEW, title: "PAN review", sub: "PAN verification", branch: BRANCHES.REGISTERED, reviewOf: SCREENS.PAN_VERIFICATION },
      { id: SCREENS.GST_VERIFICATION, title: "GST verification", sub: "GST verification", branch: BRANCHES.REGISTERED, skippable: true },
      { id: SCREENS.GST_REVIEW, title: "GST review", sub: "GST verification", branch: BRANCHES.REGISTERED, reviewOf: SCREENS.GST_VERIFICATION },
      { id: SCREENS.BUSINESS_DOCUMENTS, title: "Business documents", sub: "Business documents", isNew: true, skippable: true },
    ],
  },
  {
    id: "bank",
    label: "Bank Verification",
    screens: [
      { id: SCREENS.BANK_VERIFICATION, title: "Bank details", sub: "Bank details", skippable: true },
      { id: SCREENS.BANK_REVIEW, title: "Review", sub: "Review", reviewOf: SCREENS.BANK_VERIFICATION },
    ],
  },
  {
    id: "contract",
    label: "Partner Contract",
    screens: [{ id: SCREENS.PARTNER_CONTRACT, title: "Partner contract", sub: null }],
  },
];

export const TOTAL_GROUPS = FLOW_GROUPS.length;

// Until the vendor answers "Is your business registered?" the flow is shown
// as the registered path (the recommended option, and the design's default).
export const resolveBranch = (branch) => branch ?? BRANCHES.REGISTERED;

/**
 * @param {FlowGroup} group
 * @param {string|null} branch
 * @returns {string}
 */
export function getGroupLabel(group, branch) {
  return typeof group.label === "string" ? group.label : group.label[resolveBranch(branch)];
}

/**
 * The screens this vendor walks through, in order, for their branch.
 * @param {string|null} branch
 * @returns {(FlowScreen & { groupId: string, groupIndex: number })[]}
 */
export function getFlowScreens(branch) {
  const active = resolveBranch(branch);
  return FLOW_GROUPS.flatMap((group, groupIndex) =>
    group.screens
      .filter((screen) => !screen.branch || screen.branch === active)
      .map((screen) => ({ ...screen, groupId: group.id, groupIndex })),
  );
}
