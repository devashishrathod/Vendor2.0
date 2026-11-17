// Onboarding v3 features the backend has NO endpoint for yet. Each function
// keeps the signature the real call will have and resolves locally, so the
// screens work end-to-end today and only this file changes once the APIs
// ship. The data itself already lives in the persisted onboarding store.
//
// Missing on the backend (docs/vendor_panel_api_doc.md):
//   - saving category + MULTIPLE sub-categories at Basic Details
//   - owner / signatory KYC (owner PAN save, Aadhaar via DigiLocker, ID upload, selfie)
//   - business documents upload with a title
//   - required / optional documents per sub-category
//   - GST-mandatory categories
//   - marking a step as skipped (documents, bank) and profile-strength points

import { documentsForCategory } from "../constants/categoryDocuments";

export const PENDING_BACKEND = true;

const resolveLater = (value, ms = 400) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

/**
 * @param {{ categoryId: string, subCategoryIds: string[] }} selection
 */
export const saveCategorySelection = (selection) => resolveLater({ success: true, data: selection });

/**
 * Documents a vendor needs for the category they picked. Until the backend
 * has this, it's answered locally from constants/categoryDocuments.js.
 * @param {{ categoryName?: string, subCategoryNames?: string[] }} selection
 * @returns {Promise<{ required: string[], optional: string[] }>}
 */
export const fetchRequiredDocuments = (selection = {}) => resolveLater(documentsForCategory(selection), 0);

/**
 * Category ids that can only sell with a GSTIN.
 * @returns {Promise<string[]>}
 */
export const fetchGstMandatoryCategoryIds = () => resolveLater([], 0);

/** Starts DigiLocker consent for Aadhaar. @returns {Promise<{ verified: boolean, aadhaarLast4: string }>} */
export const verifyAadhaarWithDigiLocker = () => resolveLater({ verified: true, aadhaarLast4: "" }, 900);

/**
 * @param {{ pan: string, panName: string, idMethod: string, idType?: string, selfieTaken: boolean }} kyc
 */
export const saveOwnerKyc = (kyc) => resolveLater({ success: true, data: kyc });

/**
 * Uploads one titled business document. Reports progress 0-100.
 * @param {{ file: File, title: string }} doc
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<{ url: string|null }>}
 */
export function uploadBusinessDocument({ file }, onProgress) {
  return new Promise((resolve) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 20);
      onProgress?.(percent);
      if (percent === 100) {
        clearInterval(timer);
        resolve({ url: null, fileName: file.name });
      }
    }, 150);
  });
}
