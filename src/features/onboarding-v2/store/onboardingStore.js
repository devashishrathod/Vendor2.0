import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Onboarding form drafts only. Where the vendor is (screen, path, done /
// skipped, progress) is the server's — store/statusStore.js. Persisted under
// its own key so it never mixes with the old onboarding's "onboarding-store".
//
// KYC numbers (account number, IFSC, PAN, GSTIN) and verify results stay in
// memory only — never written to the browser's storage. After a refresh the
// bank form starts empty; a saved bank is shown masked from GET /brands/get.
const NOT_PERSISTED = ["gstin", "gstDetails", "pan", "panDetails", "ownerKyc", "bank", "bankDetails"];

const persistableForm = (form) => Object.fromEntries(Object.entries(form).filter(([key]) => !NOT_PERSISTED.includes(key)));

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
  bank: { accountNumber: "", ifsc: "", accountType: "" },
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
      /** Empties the bank form — after the account is saved (or skipped). */
      resetBank: () => set((s) => ({ form: { ...s.form, bank: initialForm.bank, bankDetails: null } })),

      reset: () => set(initialState),
    }),
    {
      name: "onboarding-v2-store",
      storage: createJSONStorage(() => localStorage),
      // v4: the screen / path / done / skipped tracker moved to the server.
      // v5: KYC numbers are no longer persisted — an older copy is dropped.
      version: 5,
      migrate: () => initialState,
      partialize: (s) => ({ form: persistableForm(s.form) }),
      // The persisted form lacks the in-memory-only keys; keep their defaults.
      merge: (persisted, current) => ({ ...current, form: { ...current.form, ...(persisted?.form ?? {}) } }),
    },
  ),
);
