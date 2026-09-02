// src/features/onboarding/services/api/verificationDetails.api.js
// Persists a re-verified PAN/GST/Bank result to the brand record — the
// exact same payload shape and endpoints the onboarding wizard's
// Step7PANReadOnly / Step9GSTReadOnly / Step12BankReadOnly steps use, just
// without the wizard's step/sub-step navigation (this is called from the
// standalone Under Review page, not a wizard step).
import { BASE_URL } from "../../../../config";

function getToken() {
  return localStorage.getItem("token");
}

async function postJSON(endpoint, payload) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errMsg = err?.message?.toLowerCase() || "";
    // Step7/9/12 treat "already exists" as a soft-success (the wizard
    // just moves on) rather than a real failure — same here.
    if (res.status === 400 && (errMsg.includes("already exists") || errMsg.includes("already in use"))) {
      return { alreadyExists: true };
    }
    throw new Error(err?.message || `Server error ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

const convertDobToISO = (dob) => {
  if (!dob) return null;
  if (dob.includes("T")) return dob;
  const [day, month, year] = dob.split("/");
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
};

// ── PAN — POST /brands/onboarding/add-pan-details ────────────────────────
// `panDetails` is the shape verifyPAN() resolves to (Step7PANReadOnly reads
// the same `panDetails?.data ?? panDetails` fallback).
export async function submitVerifiedPanDetails(brandId, panDetails) {
  const verifyData = panDetails?.data ?? panDetails ?? {};

  const verifyResponse = panDetails?.requestId
    ? panDetails
    : {
        success: verifyData.success ?? true,
        message: verifyData.message || "PAN verification completed",
        data: verifyData,
        requestId: verifyData.clientRefNum || null,
        timestamp: verifyData.timestamp || new Date().toISOString(),
        statusCode: 200,
        status: verifyData.status || "SUCCESS",
      };

  const addr = verifyData.addressDetails || {};
  const hasAddress = Object.values(addr).some((v) => v && String(v).trim() !== "");

  const payload = {
    brandId,
    pan: verifyData.pan,
    panType: verifyData.panType?.toUpperCase()?.trim(),
    fullName: verifyData.fullName || verifyData.lastName,
    isVerified: verifyData.success ?? true,
    verificationStatus: verifyData.status || "SUCCESS",
    verificationMessage: verifyData.message || "Pan verified successfully",
    providerTransactionId: verifyData.transactionId || verifyData.providerTransactionId,
    providerRequestId: verifyData.clientRefNum,
    verifiedAt: verifyData.timestamp || new Date().toISOString(),
    verificationResponse: verifyResponse,
    firstName: verifyData.firstName || undefined,
    middleName: verifyData.middleName || undefined,
    lastName: verifyData.lastName || undefined,
    dob: convertDobToISO(verifyData.dob) || undefined,
    gender: verifyData.gender || undefined,
    aadhaarNumber: verifyData.aadhaarNumber || undefined,
    isAadhaarLinked: verifyData.aadhaarLinked ?? undefined,
    addressDetails: hasAddress
      ? {
          buildingName: addr.building_name || undefined,
          locality: addr.locality || undefined,
          streetName: addr.street_name || undefined,
          pincode: addr.pincode || undefined,
          city: addr.city || undefined,
          state: addr.state || undefined,
          country: addr.country || undefined,
        }
      : undefined,
    verificationProvider: "CGPEY",
    currentScreen: "GST_VERIFICATION",
  };

  return postJSON("/brands/onboarding/add-pan-details", payload);
}

// ── GST — POST /brands/onboarding/add-gst-details ────────────────────────
const normalizeTaxpayerType = (val) => {
  if (!val) return undefined;
  const upper = val.toUpperCase().trim().replace(/\s+/g, "_");
  const map = {
    REGULAR: "REGULAR",
    COMPOSITION: "COMPOSITION",
    SEZ_UNIT: "SEZ_UNIT",
    SEZ_DEVELOPER: "SEZ_DEVELOPER",
    INPUT_SERVICE_DISTRIBUTOR: "INPUT_SERVICE_DISTRIBUTOR",
    ISD: "INPUT_SERVICE_DISTRIBUTOR",
    TAX_DEDUCTOR: "TAX_DEDUCTOR",
    TAX_COLLECTOR: "TAX_COLLECTOR",
    CASUAL_TAXABLE_PERSON: "CASUAL_TAXABLE_PERSON",
    NON_RESIDENT_TAXABLE_PERSON: "NON_RESIDENT_TAXABLE_PERSON",
    GOVERNMENT_DEPARTMENT: "GOVERNMENT_DEPARTMENT",
    UN_BODY: "UN_BODY",
    EMBASSY: "EMBASSY",
    OIDAR: "OIDAR",
    REGISTERED_PERSON: "REGISTERED_PERSON",
  };
  return map[upper] || "REGULAR";
};

const normalizeRegStatus = (val) => {
  if (!val) return undefined;
  const upper = val.toUpperCase().trim();
  if (upper === "ACTIVE") return "SUCCESS";
  return upper;
};

const convertGstDateToISO = (dateStr) => {
  if (!dateStr || dateStr === "NA") return undefined;
  if (dateStr.includes("T")) return dateStr;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))).toISOString();
  }
  return dateStr;
};

export async function submitVerifiedGstDetails(gstDetails) {
  const verifyData = gstDetails?.data ?? gstDetails ?? {};

  const verifyResponse = gstDetails?.requestId
    ? gstDetails
    : {
        success: verifyData.success ?? true,
        message: verifyData.message || "GST verification completed",
        data: verifyData,
        requestId: verifyData.clientRefNum || null,
        timestamp: verifyData.timestamp || new Date().toISOString(),
        statusCode: 200,
        status: verifyData.status || "SUCCESS",
      };

  const hasAddress =
    verifyData.address && Object.values(verifyData.address).some((v) => v && String(v).trim() !== "");

  const payload = {
    gstNumber: verifyData.gstNumber,
    legalName: verifyData.legalName,
    constitutionOfBusiness: verifyData.constitutionOfBusiness,
    taxpayerType: normalizeTaxpayerType(verifyData.taxpayerType),
    registrationDate: convertGstDateToISO(verifyData.registrationDate),
    registrationStatus: normalizeRegStatus(verifyData.registrationStatus),
    isVerified: verifyData.success ?? true,
    verificationStatus: verifyData.status || "SUCCESS",
    verificationMessage: verifyData.message || "GST verified successfully",
    providerTransactionId: verifyData.transactionId || verifyData.providerTransactionId,
    providerRequestId: verifyData.clientRefNum,
    verifiedAt: verifyData.timestamp || new Date().toISOString(),
    verificationResponse: verifyResponse,
    tradeName: verifyData.tradeName || undefined,
    cancellationDate: verifyData.cancellationDate || undefined,
    filingStatus: verifyData.filingStatus || undefined,
    stateCode: verifyData.stateCode || undefined,
    centerCode: verifyData.centerCode || undefined,
    natureOfBusiness:
      Array.isArray(verifyData.natureOfBusiness) && verifyData.natureOfBusiness.length > 0
        ? verifyData.natureOfBusiness
        : undefined,
    stateJurisdiction: verifyData.stateJurisdiction || undefined,
    stateJurisdictionCode: verifyData.stateJurisdictionCode || undefined,
    lastUpdated: convertGstDateToISO(verifyData.lastUpdated),
    address: hasAddress
      ? {
          floorNumber: verifyData.address.floor_number || undefined,
          buildingNumber: verifyData.address.building_number || undefined,
          buildingName: verifyData.address.building_name || undefined,
          location: verifyData.address.location || undefined,
          city: verifyData.address.city || undefined,
          district: verifyData.address.district || undefined,
          state: verifyData.address.state || undefined,
          pin: verifyData.address.pin || undefined,
          country: "India",
          latitude: verifyData.address.latitude || undefined,
          longitude: verifyData.address.longitude || undefined,
          businessNature: verifyData.address.business_nature || undefined,
        }
      : undefined,
    chargeable: verifyData.chargeable ?? true,
    userConsent: verifyData.userConsent ?? true,
    verificationProvider: "CGPEY",
    currentScreen: "BANK_VERIFICATION",
  };

  return postJSON("/brands/onboarding/add-gst-details", payload);
}

// ── Bank — POST /brands/onboarding/add-bank-details ──────────────────────
function extractPincode(address) {
  if (!address) return null;
  const matches = address.match(/\b\d{6}\b/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1];
}

// `bankDetails` is the shape verifyBank() resolves to, merged with
// `enteredAccountNumber`/`accountType` the same way Step11BankEnter merges
// them onto formData.bankDetails before Step12 reads it.
export async function submitVerifiedBankDetails(bankDetails, { enteredAccountNumber, accountType } = {}) {
  const raw = bankDetails ?? {};
  const verifyResult = raw.result ?? raw ?? {};

  const verifyResponse = {
    success: raw.success ?? true,
    status: raw.status || "SUCCESS",
    message: raw.message || "Bank verified successfully",
    result: verifyResult,
    tranx_id: raw.tranx_id || null,
    requestId: raw.requestId || null,
    timestamp: raw.timestamp || new Date().toISOString(),
    chargeble: raw.chargeble ?? true,
    user_consent: raw.user_consent ?? true,
  };

  const bankAddressPayload = (() => {
    if (verifyResult.bank_address && typeof verifyResult.bank_address === "object") {
      return {
        addressLine1: verifyResult.bank_address.addressLine1 || undefined,
        city: verifyResult.bank_address.city || undefined,
        district: verifyResult.bank_address.district || undefined,
        state: verifyResult.bank_address.state || undefined,
        pinCode: verifyResult.bank_address.pinCode || undefined,
        country: verifyResult.bank_address.country || "India",
      };
    }
    if (typeof verifyResult.bank_address === "string") {
      return {
        addressLine1: verifyResult.bank_address,
        pinCode: extractPincode(verifyResult.bank_address) || undefined,
      };
    }
    if (raw.ifscBankAddress) {
      return {
        addressLine1: raw.ifscBankAddress,
        city: raw.ifscCity || undefined,
        district: raw.ifscDistrict || undefined,
        state: raw.ifscState || undefined,
        pinCode: extractPincode(raw.ifscBankAddress) || undefined,
        country: "India",
      };
    }
    return undefined;
  })();

  const payload = {
    isValid: verifyResult.is_valid,
    recommendedAction: verifyResult.recommended_action,
    accountHolderName: verifyResult.account_holder_name,
    accountNumber: enteredAccountNumber || raw.enteredAccountNumber,
    ifscCode: verifyResult.account_ifsc,

    isVerified: verifyResponse.success ?? true,
    verificationStatus: verifyResponse.status || "SUCCESS",
    verificationMessage: verifyResponse.message || "Bank verified successfully",
    providerTransactionId: verifyResponse.tranx_id || undefined,
    providerRequestId: verifyResponse.requestId || undefined,
    verifiedAt: verifyResponse.timestamp,
    verificationResponse: verifyResponse,
    verificationProvider: "CGPEY",
    currentScreen: "SYSTEM_VERIFICATION",

    accountType: accountType || raw.accountType || undefined,

    bankName: verifyResult.bank_name || raw.ifscBankName || undefined,
    branchName: verifyResult.bank_branch || raw.ifscBranchName || undefined,
    bankAddress: bankAddressPayload,

    micrCode: verifyResult.micr_code || raw.ifscMicr || undefined,

    isNameMatch: verifyResult.is_name_match ?? undefined,
    matchingScore: verifyResult.matching_score != null ? String(verifyResult.matching_score) : undefined,

    paymentMode: verifyResult.payment_mode || undefined,
    failureReason: verifyResult.failure_reason || undefined,
    npciErrorCode: verifyResult.npci_error_code || undefined,
    retrievalReferenceNumber: verifyResult.rrn || undefined,
    user: verifyResult.user || undefined,

    chargeable: raw.chargeble === "true" || raw.chargeble === true,
    userConsent: raw.user_consent === "true" || raw.user_consent === true,
  };

  return postJSON("/brands/onboarding/add-bank-details", payload);
}
