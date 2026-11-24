import { create } from "zustand";

const AUTO_DISMISS_MS = 5000;
let nextId = 1;
const timers = new Map();

/**
 * Toasts for onboarding — errors (and anything else short-lived) appear in
 * the top-right corner and dismiss themselves. Rendered by `<Toaster />`.
 */
export const useToastStore = create((set, get) => ({
  /** @type {{ id: number, tone: "error"|"success"|"info", message: import('react').ReactNode }[]} */
  toasts: [],

  /**
   * Shows a toast. The same text already on screen is replaced (timer
   * restarts) instead of stacking a duplicate.
   * @param {{ tone?: "error"|"success"|"info", message: import('react').ReactNode, duration?: number }} toast
   * @returns {number} toast id
   */
  push: ({ tone = "error", message, duration = AUTO_DISMISS_MS }) => {
    const duplicate = typeof message === "string" ? get().toasts.find((t) => t.message === message) : null;
    if (duplicate) get().dismiss(duplicate.id);
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, tone, message }] }));
    timers.set(
      id,
      setTimeout(() => get().dismiss(id), duration),
    );
    return id;
  },

  /** @param {number} id */
  dismiss: (id) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Shortcut for non-React code: `toastError("Something failed")`. */
export const toastError = (message) => useToastStore.getState().push({ tone: "error", message });
