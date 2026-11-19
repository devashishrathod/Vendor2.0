import { useEffect, useState } from "react";
import { lookupIfsc, verifyBankAccount } from "../../services/onboardingApi";

// Shared by the onboarding Bank step and the outlet review's "Add bank
// account" popup, so both verify and store the account the same way.

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

const extractPincode = (address = "") => address.match(/\b\d{6}\b/g)?.pop() ?? undefined;

/**
 * Bank address in the shape the save endpoint expects: the penny-drop
 * result's address when it has one, else the IFSC directory's.
 */
function resolveBankAddress(verifyAddress, ifscInfo) {
  if (verifyAddress && typeof verifyAddress === "object") return verifyAddress;
  if (typeof verifyAddress === "string" && verifyAddress.trim()) {
    return { addressLine1: verifyAddress.trim(), pinCode: extractPincode(verifyAddress), country: "India" };
  }
  if (ifscInfo?.ADDRESS) {
    return {
      addressLine1: ifscInfo.ADDRESS,
      city: ifscInfo.CITY || undefined,
      district: ifscInfo.DISTRICT || undefined,
      state: ifscInfo.STATE || undefined,
      pinCode: extractPincode(ifscInfo.ADDRESS),
      country: "India",
    };
  }
  return null;
}

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

const BENEFICIARY_MIN = 3;
const BENEFICIARY_MAX = 100;

/**
 * Name the backend matches the account holder against: the beneficiary the
 * vendor typed, else the business's legal name. Left out if too short.
 */
function beneficiaryNameFor(bank, legalName) {
  const name = (bank.beneficiary || "").trim() || (legalName || "").trim();
  return name.length >= BENEFICIARY_MIN ? name.slice(0, BENEFICIARY_MAX) : undefined;
}

/**
 * Runs the ₹1 penny-drop and returns the record to keep as
 * `form.bankDetails`. Throws with a readable message when it fails.
 * @param {{ bank: { accountNumber: string, ifsc: string, beneficiary: string, accountType: string }, ifscInfo: object|null, legalName?: string }} input
 */
export async function verifyBankForm({ bank, ifscInfo, legalName = "" }) {
  const response = await verifyBankAccount({
    accountNumber: bank.accountNumber,
    ifsc: bank.ifsc,
    beneficiaryName: beneficiaryNameFor(bank, legalName),
  });
  const data = response?.data || response || {};
  const result = data.result ?? {};
  if (!data.success || data.status === "FAILED" || result.is_valid === false) {
    throw new Error(result.failure_reason || data.message || "Bank verification failed. Please check your details and try again.");
  }
  return {
    ...data,
    result: {
      ...result,
      account_ifsc: result.account_ifsc || bank.ifsc,
      bank_name: result.bank_name ?? ifscInfo?.BANK ?? null,
      bank_branch: result.bank_branch ?? ifscInfo?.BRANCH ?? null,
      bank_address: resolveBankAddress(result.bank_address, ifscInfo),
      micr_code: result.micr_code ?? ifscInfo?.MICR ?? null,
    },
    ifsc: bank.ifsc,
    enteredAccountNumber: bank.accountNumber,
    accountType: bank.accountType,
    beneficiary: bank.beneficiary.trim() || null,
    ifscBankName: ifscInfo?.BANK ?? null,
    ifscBranchName: ifscInfo?.BRANCH ?? null,
    ifscBankAddress: ifscInfo?.ADDRESS ?? null,
    ifscCity: ifscInfo?.CITY ?? null,
    ifscDistrict: ifscInfo?.DISTRICT ?? null,
    ifscState: ifscInfo?.STATE ?? null,
    ifscMicr: ifscInfo?.MICR ?? null,
  };
}
