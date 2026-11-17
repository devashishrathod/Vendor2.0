import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DOCUMENT_RULES } from "../constants/onboardingOptions";
import { SCREENS } from "../config/onboardingFlow";

// Onboarding v3 state — where the vendor is, which path they're on, and
// what they've entered so far. Persisted under its own key so it never
// mixes with the production onboarding's "onboarding-store".

/**
 * @typedef {Object} BusinessDocument
 * @property {string} id
 * @property {string} title
 * @property {string|null} fileName
 * @property {number|null} fileSize
 * @property {'empty'|'selected'|'uploading'|'uploaded'} status   - selected = chosen, not saved yet
 * @property {number} [progress]   - 0-100 while uploading
 * @property {string|null} [url]   - uploaded file location, once the upload API exists
 */

/**
 * @typedef {Object} SubCategory
 * @property {string} id
 * @property {string} name
 */

const initialForm = {
  // Step 1 · Basic Details
  brandName: "",
  categoryId: null,
  categoryName: "",
  /** @type {SubCategory[]} */
  subCategories: [],

  // Step 2 · Verification
  gstin: "",
  gstDetails: null,
  pan: "",
  panDetails: null,
  entityType: null,
  /** Filled from GST / business PAN / owner PAN — never typed by the vendor. */
  legalName: "",
  ownerKyc: {
    pan: "",
    panName: "",
    panDetails: null,
    idMethod: "digilocker", // 'digilocker' | 'upload'
    idType: null, // 'DRIVING_LICENCE' | 'PASSPORT' | 'VOTER_ID'
    idFileName: null,
    idVerified: false,
    aadhaarLast4: "",
    selfieTaken: false,
  },
  /** @type {BusinessDocument[]} */
  documents: [],

  // Step 3 · Payout
  bank: { accountNumber: "", ifsc: "", beneficiary: "", accountType: "" },
  bankDetails: null,

  // Step 4 · Agreement & Plan
  contractAcceptedAt: null,
  plan: null,
  payment: null,
  billingAddress: null,

  // Step 5 · Brand Outlet (owned by the outlet pages)
  outlet: {},
  submittedAt: null,
};

const initialState = {
  currentScreen: SCREENS.BRAND_NAME,
  // Set while editing a completed step from the preview: the screen the
  // vendor was on, so Continue takes them straight back there.
  returnTo: null,
  branch: null,
  completed: [],
  skipped: [],
  form: initialForm,
};

const newDocumentId = () => `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useOnboardingV2Store = create(
  persist(
    (set) => ({
      ...initialState,

      goTo: (screen) => set({ currentScreen: screen }),
      setReturnTo: (screen) => set({ returnTo: screen }),
      setBranch: (branch) => set({ branch }),

      setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
      /** Merge `patch` into an object field of the form (ownerKyc, bank, outlet …). */
      patchForm: (key, patch) =>
        set((s) => ({ form: { ...s.form, [key]: { ...(s.form[key] || {}), ...patch } } })),
      setBankField: (key, value) => set((s) => ({ form: { ...s.form, bank: { ...s.form.bank, [key]: value } } })),

      markCompleted: (screen) =>
        set((s) => ({
          completed: s.completed.includes(screen) ? s.completed : [...s.completed, screen],
          skipped: s.skipped.filter((id) => id !== screen),
        })),

      markSkipped: (screen) =>
        set((s) => (s.skipped.includes(screen) ? {} : { skipped: [...s.skipped, screen] })),

      /** @param {string} [title] */
      addDocument: (title = "") =>
        set((s) => (s.form.documents.length >= DOCUMENT_RULES.maxDocuments ? {} : {
          form: {
            ...s.form,
            documents: [
              ...s.form.documents,
              { id: newDocumentId(), title, fileName: null, fileSize: null, status: "empty", progress: 0, url: null },
            ],
          },
        })),

      /** @param {string} id @param {Partial<BusinessDocument>} patch */
      updateDocument: (id, patch) =>
        set((s) => ({
          form: {
            ...s.form,
            documents: s.form.documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)),
          },
        })),

      removeDocument: (id) =>
        set((s) => ({ form: { ...s.form, documents: s.form.documents.filter((doc) => doc.id !== id) } })),

      reset: () => set(initialState),
    }),
    {
      name: "onboarding-v2-store",
      storage: createJSONStorage(() => localStorage),
      // v2 → v3 changed every screen id and most form keys; start fresh.
      version: 3,
      migrate: () => initialState,
      partialize: (s) => ({
        currentScreen: s.currentScreen,
        returnTo: s.returnTo,
        branch: s.branch,
        completed: s.completed,
        skipped: s.skipped,
        form: s.form,
      }),
    },
  ),
);
