import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Onboarding form drafts only. Where the vendor is (screen, path, done /
// skipped, progress) is the server's — store/statusStore.js. Persisted under
// its own key so it never mixes with the old onboarding's "onboarding-store".

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
  // Read by the outlet review page (Milestone B). Owner verification itself
  // is saved on the server (owner-verification); DigiLocker and selfie are gone.
  ownerKyc: {
    pan: "",
    panName: "",
    panDetails: null,
    idType: null,
    idFileName: null,
  },

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
  form: initialForm,
};

export const useOnboardingV2Store = create(
  persist(
    (set) => ({
      ...initialState,

      setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
      /** Merge `patch` into an object field of the form (ownerKyc, bank, outlet …). */
      patchForm: (key, patch) =>
        set((s) => ({ form: { ...s.form, [key]: { ...(s.form[key] || {}), ...patch } } })),
      setBankField: (key, value) => set((s) => ({ form: { ...s.form, bank: { ...s.form.bank, [key]: value } } })),

      reset: () => set(initialState),
    }),
    {
      name: "onboarding-v2-store",
      storage: createJSONStorage(() => localStorage),
      // v4: the screen / path / done / skipped tracker moved to the server.
      version: 4,
      migrate: () => initialState,
      partialize: (s) => ({ form: s.form }),
    },
  ),
);
