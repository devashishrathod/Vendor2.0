// ── steps.js ─────────────────────────────────────────────────────────────────
export const STEPS = {
  BASIC_DETAILS:        1,   // Business Name + Registration + Business Type
  BUSINESS_VERIFICATION: 2,  // PAN Enter → PAN ReadOnly → GST Enter → GST ReadOnly
  SYSTEM_VERIFY:        3,
  BANK_ENTER:           4,
  BANK_READONLY:        5,
  PARTNER_CONTRACT:     6,
  COMPLETE:             7,
};

export const TOTAL_STEPS = 7;

export const STEP_LABELS = {
  1: "Basic Details",
  2: "Business Verification",
  3: "System Verification",
  4: "Bank Verification – Enter Details",
  5: "Bank Details (Read Only)",
  6: "Partner Contract",
  7: "Onboarding Complete",
};

export const BUSINESS_TYPES = [
  { id: "pvt_ltd",        label: "Pvt. Ltd." },
  { id: "llp",            label: "LLP" },
  { id: "partnership",    label: "Partnership" },
  { id: "proprietorship", label: "Proprietorship" },
  { id: "others",         label: "Others" },
];