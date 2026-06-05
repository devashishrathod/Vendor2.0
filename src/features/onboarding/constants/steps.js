export const STEPS = {
  BASIC_DETAILS:           1,
  BUSINESS_VERIFICATION:   2,
  SYSTEM_VERIFY:           3,
  BANK_VERIFICATION:       4,  // Bank Enter + Bank ReadOnly (grouped)
  PARTNER_CONTRACT:        5,  // Last step = Complete bhi yahi
};

export const TOTAL_STEPS = 5;

export const STEP_LABELS = {
  1: "Basic Details",
  2: "Business Verification",
  3: "System Verification",
  4: "Bank Verification",
  5: "Partner Contract",
};

export const BUSINESS_TYPES = [
  { id: "pvt_ltd",        label: "Pvt. Ltd." },
  { id: "llp",            label: "LLP" },
  { id: "partnership",    label: "Partnership" },
  { id: "proprietorship", label: "Proprietorship" },
  { id: "others",         label: "Others" },
];