import { useEffect, useState } from "react";
import { lookupIfsc, verifyBankAccount } from "../../services/onboardingApi";

// Shared by the onboarding Bank step and the outlet review's "Add bank
// account" popup, so both verify and save the account the same way: a paid
// verify-bank, then add-bank-details with only its verificationId.

export const ACCOUNT_MAX = 18;
export const IFSC_LENGTH = 11;
export const IFSC_FORMAT = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const IFSC_LOOKUP_DELAY_MS = 350;

/** "•••• •••• 9012" — grouped mask shown while the field isn't focused. */
export function maskGrouped(accountNumber) {
  if (accountNumber.length <= 4) return accountNumber;
  const hidden = "•".repeat(accountNumber.length - 4).replace(/(.{4})(?=.)/g, "$1 ");
  return `${hidden} ${accountNumber.slice(-4)}`;
}

/** "XXXX XXXX 9012" */
export const maskForReview = (accountNumber = "") =>
  accountNumber.length > 4 ? `XXXX XXXX ${accountNumber.slice(-4)}` : accountNumber || "—";

/**
 * Live IFSC → bank + branch, debounced. Results are keyed by the IFSC they
 * belong to, so a stale answer is never shown.
 * @param {string} ifsc
 * @returns {{ ifscValid: boolean, lookupDone: boolean, ifscInfo: object|null, lookupError: string }}
 */
export function useIfscLookup(ifsc) {
  const [lookup, setLookup] = useState({ ifsc: "", info: null, error: "" });
  const ifscValid = IFSC_FORMAT.test(ifsc);

  useEffect(() => {
    if (!ifscValid) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const info = await lookupIfsc(ifsc);
        if (active) setLookup({ ifsc, info, error: info ? "" : "We couldn't find a bank for this IFSC." });
      } catch (error) {
        console.error("IFSC lookup failed:", error);
        if (active) setLookup({ ifsc, info: null, error: "We couldn't look up this IFSC right now." });
      }
    }, IFSC_LOOKUP_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [ifsc, ifscValid]);

  const lookupDone = ifscValid && lookup.ifsc === ifsc;
  return { ifscValid, lookupDone, ifscInfo: lookupDone ? lookup.info : null, lookupError: lookupDone ? lookup.error : "" };
}

/**
 * Runs the PAID ₹1 penny drop (verify-bank, API doc #30). Call only on an
 * explicit "Verify" press. A failed drop is still a 200 with
 * `isVerified: false` and the bank's reason in `message` — check
 * `result.isVerified` before saving. Only account number + IFSC are sent:
 * the server matches the holder's name itself (#30 note 1, D114).
 * @param {{ bank: { accountNumber: string, ifsc: string, accountType: string } }} input
 * @returns {Promise<{ result: import("../../types").VerifyResult, accountNumber: string, ifsc: string, accountType: string }>}
 */
export async function verifyBankForm({ bank }) {
  const response = await verifyBankAccount({ accountNumber: bank.accountNumber, ifscCode: bank.ifsc });
  // The raw provider payload is never kept; the panel reads mapped fields.
  const result = { ...(response?.data ?? {}) };
  delete result.providerResponse;
  return { result, accountNumber: bank.accountNumber, ifsc: bank.ifsc, accountType: bank.accountType };
}

/**
 * Same account + IFSC as a verification already held — no second paid call.
 * @param {{ accountNumber: string, ifsc: string }|null} verified
 * @param {{ accountNumber: string, ifsc: string }} bank
 */
export const isSameAccount = (verified, bank) =>
  Boolean(verified?.result?.isVerified && verified.accountNumber === bank.accountNumber && verified.ifsc === bank.ifsc);
