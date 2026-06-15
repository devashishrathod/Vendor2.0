// ── All client-side validations (called BEFORE any API) ──────────────────────

// Step 1 — WhatsApp
export function validateWhatsApp(number) {
  const clean = number.replace(/\D/g, "");
  if (!clean) return "WhatsApp number is required";
  if (clean.length !== 10) return "Must be a 10-digit number";
  if (!/^[6-9]/.test(clean)) return "Must start with 6, 7, 8, or 9";
  return null;
}

// Step 2 — OTP
export function validateOTP(otp) {
  if (!otp || otp.length !== 6) return "Enter the 6-digit OTP";
  if (!/^\d{6}$/.test(otp)) return "OTP must be numeric";
  return null;
}

// Step 3 — Business Name
export function validateBusinessName(name) {
  if (!name?.trim()) return "Business name is required";
  if (name.trim().length < 3) return "Must be at least 3 characters";
  return null;
}

export function validateShortName(short) {
  if (!short?.trim()) return null; // optional
  const s = short.trim();
  if (s.length < 2)  return "Short name must be at least 2 characters";
  if (s.length > 10) return "Short name must be 10 characters or less";
  if (!/^[A-Za-z0-9 &.'-]+$/.test(s))
    return "Only letters, numbers, spaces, &, ., ' and - allowed";
  return null;
}

// Step 7 — PAN
export function validatePAN(pan) {
  if (!pan) return "PAN is required";
  const normalizedPAN = pan.toUpperCase();
  if (normalizedPAN.length !== 10) return "PAN must be exactly 10 characters";
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(normalizedPAN))
    return "Please enter a valid PAN number (e.g. ABCDE1234F)";
  if (normalizedPAN[3] === "P")
    return "The provided PAN appears to be an Individual PAN. Please enter a valid Business PAN associated with your registered entity.";
  return null;
}

export const PAN_RULES = [
  { label: "10 characters",                    test: (v) => v.length === 10 },
  { label: "5 letters + 4 numbers + 1 letter", test: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase()) },
  { label: "No special characters",            test: (v) => /^[A-Z0-9]+$/i.test(v) },
  { label: "Must be a Business PAN",           test: (v) => v.length >= 4 && v[3] !== "P" },
];

// Step 8 — GST
export function validateGST(gstin, pan = '') {
  if (!gstin) return "GSTIN is required";
  if (gstin.length !== 15) return "GSTIN must be exactly 15 characters";
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase()))
    return "Invalid GSTIN format";

  // ✅ PAN-GST cross-check: characters 3–12 of GSTIN must match PAN
  if (pan && pan.trim().length === 10) {
    const panFromGST = gstin.substring(2, 12).toUpperCase();
    const panUpper   = pan.toUpperCase();
    if (panFromGST !== panUpper) {
      return `GSTIN does not match your PAN (${panUpper}). Characters 3–12 of GSTIN must be your PAN.`;
    }
  }

  return null;
}

export const GST_RULES = [
  { label: "15 characters",        test: (v)       => v.length === 15 },
  { label: "Valid GST format",     test: (v)       => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(v) },
  { label: "State code valid",     test: (v)       => parseInt(v.slice(0, 2)) >= 1 && parseInt(v.slice(0, 2)) <= 37 },
  { label: "PAN embedded matches", test: (v, pan)  => !!pan && pan.length === 10 && v.slice(2, 12).toUpperCase() === pan.toUpperCase() },
];

// Step 11 — Bank
export function validateBankDetails({ accountNumber, ifsc, accountHolderName }) {
  const errors = {};
  if (!accountNumber?.trim()) errors.accountNumber = "Account number is required";
  else if (!/^\d{9,18}$/.test(accountNumber)) errors.accountNumber = "Invalid account number";

  if (!ifsc?.trim()) errors.ifsc = "IFSC code is required";
  else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) errors.ifsc = "Invalid IFSC format (e.g. HDFC0001234)";

  if (!accountHolderName?.trim()) errors.accountHolderName = "Account holder name is required";

  return Object.keys(errors).length ? errors : null;
}

export const BANK_RULES = [
  { label: "Valid account number", test: (v) => /^\d{9,18}$/.test(v.accountNumber) },
  { label: "Valid IFSC code",      test: (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v.ifsc) },
  { label: "Account not found",    test: () => true }, // checked via API
  { label: "Name mismatch",        test: () => true }, // checked via API
];