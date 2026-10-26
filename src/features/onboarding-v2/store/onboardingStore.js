import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SCREENS } from "../config/onboardingFlow";

// Onboarding v2 state — where the vendor is, which path they're on, and
// what they've entered so far. Persisted under its own key so it never
// mixes with the current onboarding's "onboarding-store".

/**
 * @typedef {Object} BusinessDocument
 * @property {string} id
 * @property {string} title
 * @property {string|null} fileName
 * @property {number|null} fileSize
 */

const initialForm = {
  legalName: "",
  brandName: "",
  categoryId: null,
  subCategory: null,
  entityType: null,
  pan: "",
  panDetails: null,
  gstin: "",
  gstDetails: null,
  /** @type {BusinessDocument[]} */
  documents: [],
  bank: { accountNumber: "", ifsc: "", beneficiary: "", accountType: "" },
  bankDetails: null,
  contractAccepted: false,
};

const initialState = {
  currentScreen: SCREENS.BUSINESS_NAME,
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
      setBranch: (branch) => set({ branch }),

      setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
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
        set((s) => ({
          form: {
            ...s.form,
            documents: [...s.form.documents, { id: newDocumentId(), title, fileName: null, fileSize: null }],
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
      version: 1,
      partialize: (s) => ({
        currentScreen: s.currentScreen,
        branch: s.branch,
        completed: s.completed,
        skipped: s.skipped,
        form: s.form,
      }),
    },
  ),
);
