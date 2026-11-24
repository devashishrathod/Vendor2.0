import { create } from "zustand";

// Results of the PAID verify calls (verify-gst / verify-pan / verify-bank)
// for the review sub-step and the next screens (GST → PAN prefill, PAN →
// entity suggestion). Session memory only — never persisted (they carry
// account numbers); after a refresh the same number is verified again, which
// the server answers from its reuse window for free (`reused: true`).

/** @typedef {'GST'|'PAN'|'BANK'|'OWNER_PAN'} VerifyKind */

/** Drops the raw provider payload; the panel only reads mapped fields. */
const strip = (result) => {
  if (!result) return null;
  const rest = { ...result };
  delete rest.providerResponse;
  return rest;
};

export const useVerifyStore = create((set) => ({
  /** @type {Partial<Record<VerifyKind, object>>} */
  results: {},

  /** @param {VerifyKind} kind @param {object} result - verify response `data` */
  setResult: (kind, result) => set((s) => ({ results: { ...s.results, [kind]: strip(result) } })),

  /** @param {VerifyKind} kind */
  clearResult: (kind) =>
    set((s) => {
      const results = { ...s.results };
      delete results[kind];
      return { results };
    }),

  reset: () => set({ results: {} }),
}));
