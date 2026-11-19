import { BRANCHES } from "../config/onboardingFlow";

// Category tiles shown before "More" expands the rest.
export const VISIBLE_CATEGORY_COUNT = 7;

// Business type — values match the backend BUSINESS_ENTITY_TYPE enum.
export const PRIMARY_ENTITY_TYPES = [
  { value: "PROPRIETORSHIP", label: "Proprietorship", description: "One owner runs the business" },
  { value: "PARTNERSHIP", label: "Partnership", description: "Two or more partners" },
  { value: "LLP", label: "LLP", description: "Limited liability partnership" },
  { value: "PRIVATE_LIMITED", label: "Pvt. Ltd.", description: "Private limited company" },
  { value: "PUBLIC_LIMITED", label: "Public Ltd.", description: "Public limited company" },
];

/** The only entity values a vendor can pick (and that we recommend). */
export const ENTITY_VALUES = PRIMARY_ENTITY_TYPES.map((t) => t.value);

// Owner verification (not registered): ID types that can be uploaded instead of DigiLocker.
export const OWNER_ID_TYPES = [
  { value: "DRIVING_LICENCE", label: "Driving licence" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER_ID", label: "Voter ID" },
];

// Values match the backend BANK_ACCOUNT_TYPES enum.
export const BANK_ACCOUNT_TYPES = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
  { value: "NRE", label: "NRE" },
  { value: "NRO", label: "NRO" },
  { value: "OD", label: "OD" },
  { value: "CC", label: "CC" },
  { value: "OTHER", label: "Other" },
];

// Business documents: suggested titles per branch. `null` is replaced by
// the selected category's licence.
const REGISTERED_DOCUMENT_SUGGESTIONS = [null, "Shop & Establishment", "Trade licence", "Shop photo", "Rent agreement"];
export const DOCUMENT_SUGGESTIONS = {
  [BRANCHES.GST]: REGISTERED_DOCUMENT_SUGGESTIONS,
  [BRANCHES.REG_NO_GST]: REGISTERED_DOCUMENT_SUGGESTIONS,
  [BRANCHES.UNREGISTERED]: ["Aadhaar (masked)", "Voter ID", null, "Electricity bill", "Shop photo", "Rent agreement"],
};

export const DOCUMENT_RULES = Object.freeze({
  maxSizeBytes: 5 * 1024 * 1024,
  minImageSidePx: 800,
  acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
  accept: ".pdf,.jpg,.jpeg,.png",
  maxTitleLength: 60,
  maxDocuments: 5,
});

export const NAME_LIMITS = Object.freeze({
  legalMax: 60,
  brandMin: 2,
  brandMax: 15,
});

export const PARTNER_AGREEMENT_URL = "https://trydood.com/partner-agreement";
export const TERMS_URL = "https://trydood.com/terms-of-service";
export const HELPDESK_EMAIL = "helpdesk@trydood.com";
// Contact shown on the partner agreement (same as the old Step14PartnerContract).
export const SUPPORT_EMAIL = "support@trydood.com";

// Same summary clauses the old partner contract step (Step14PartnerContract) shows.
export const PARTNER_TERMS = [
  {
    title: "Partnership Scope",
    body: "This agreement governs the relationship between Trydood and the Partner for the purpose of delivering services as outlined in the onboarding documentation.",
  },
  {
    title: "Roles & Responsibilities",
    body: "The Partner agrees to maintain accurate business information, comply with applicable laws, and fulfil all obligations as described in the Trydood Partner Handbook.",
  },
  {
    title: "Revenue & Payments",
    body: "Payouts will be processed per the agreed schedule. Trydood reserves the right to withhold payments in case of policy violations or disputed transactions.",
  },
];
