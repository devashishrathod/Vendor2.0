import axios from "axios";

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{base_url}} — this project's actual
// env var is VITE_BASE_URL (see src/config/index.js).
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// Attach auth token automatically (same pattern as the transaction
// feature's transactionService.js). The real authStore lives at
// features/onboarding/store/authStore.js and stores the token as `token`.
api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import("../../onboarding/store/authStore");
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function handleError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again.";
  throw new Error(message);
}

function buildParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    out[key] = value;
  });
  return out;
}

/* -------------------------------------------------------------------------
 * Settlements — "My payouts" list, one payout's own detail, and the
 * statement lines (transactions) that make up one payout.
 * ---------------------------------------------------------------------- */

// ── Get All Settlements ("Mere payouts") ──────────────────────────
// GET {{base_url}}/settlements?page=&limit=&status=&open=&from=&to=
export async function getSettlements({
  page = 1,
  limit = 20,
  status,
  open,
  from,
  to,
} = {}) {
  try {
    const { data } = await api.get("/settlements", {
      params: buildParams({ page, limit, status, open, from, to }),
    });
    return data;
  } catch (error) {
    handleError(error);
  }
}

// ── Get One Settlement ("Ek payout, iske saath") ──────────────────
// GET {{base_url}}/settlements/:settlement_id
export async function getSettlementById(settlementId) {
  try {
    if (!settlementId) throw new Error("settlementId is required");
    const { data } = await api.get(`/settlements/${settlementId}`);
    return data;
  } catch (error) {
    handleError(error);
  }
}

// ── Get Statement Lines ("is payout me kya-kya tha") ──────────────
// GET {{base_url}}/settlements/:settlement_id/transactions?page=&limit=
export async function getSettlementTransactions(
  settlementId,
  { page = 1, limit = 50 } = {}
) {
  try {
    if (!settlementId) throw new Error("settlementId is required");
    const { data } = await api.get(`/settlements/${settlementId}/transactions`, {
      params: buildParams({ page, limit }),
    });
    return data;
  } catch (error) {
    handleError(error);
  }
}

// ── Raise a ticket against a settlement ───────────────────────────
// ⚠️ NOT CONFIRMED — no ticket-raising endpoint was shared for this
// feature (only the 3 GET endpoints above). Left as an explicit "not
// available yet" failure instead of silently faking a success response,
// so the Create Ticket UI fails honestly until a real endpoint is added.
export async function raiseTicket() {
  throw new Error("Raising a settlement ticket isn't available yet.");
}

export default {
  getSettlements,
  getSettlementById,
  getSettlementTransactions,
  raiseTicket,
};
