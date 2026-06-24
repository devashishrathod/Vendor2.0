



export const STEPS = {
  BASIC_DETAILS: 1,
  BUSINESS_VERIFICATION: 2,
  BANK_VERIFICATION: 3,      // ← 3 pe aaya
  SYSTEM_VERIFY: 4,          // ← 4 pe gaya
  PARTNER_CONTRACT: 5,
};

export const TOTAL_STEPS = 5;

export const STEP_LABELS = {
  1: "Basic Details",
  2: "Business Verification",
  3: "Bank Verification",    // ← updated
  4: "System Verification",  // ← updated
  5: "Partner Contract",
};

export const BUSINESS_TYPES = [
  { id: "pvt_ltd", label: "Pvt. Ltd." },
  { id: "llp", label: "LLP" },
  { id: "partnership", label: "Partnership" },
  { id: "proprietorship", label: "Proprietorship" },
  { id: "others", label: "Others" },
];
