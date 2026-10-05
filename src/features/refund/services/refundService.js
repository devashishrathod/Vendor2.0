import axios from 'axios';

// Same per-feature Axios setup as transactionService.js — VITE_BASE_URL
// already ends in /trydood/v1, matching Postman's {{base_url}}/trydood/v1.
const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('../../onboarding/store/authStore');
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
    'Something went wrong. Please try again.';
  throw new Error(message);
}

/**
 * GET {{base_url}}/refunds?open=&page=&limit=
 * @param {Object} [opts]
 * @param {boolean} [opts.open] true → open refunds only; omitted → no filter
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 * @returns {Promise<Object>} raw API envelope
 */
export async function getRefunds({ open, page = 1, limit = 20 } = {}) {
  try {
    const params = { page, limit };
    if (typeof open === 'boolean') params.open = open;
    const { data } = await api.get('/refunds', { params });
    return data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * PATCH {{base_url}}/refunds/:refundId/approve — full or partial approval.
 * @param {string} refundId
 * @param {{approvedAmount: number, note?: string}} body
 * @returns {Promise<Object>} raw API envelope
 */
export async function approveRefund(refundId, { approvedAmount, note }) {
  try {
    if (!refundId) throw new Error('refundId is required');
    const body = { approvedAmount };
    if (note) body.note = note;
    const { data } = await api.patch(`/refunds/${refundId}/approve`, body);
    return data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * PATCH {{base_url}}/refunds/:refundId/reject
 * @param {string} refundId
 * @param {{note: string}} body
 * @returns {Promise<Object>} raw API envelope
 */
export async function rejectRefund(refundId, { note }) {
  try {
    if (!refundId) throw new Error('refundId is required');
    const { data } = await api.patch(`/refunds/${refundId}/reject`, { note });
    return data;
  } catch (error) {
    handleError(error);
  }
}

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
    : "—";

const humanize = (s) =>
  s ? s.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "—";

// Confirmed refund record fields (Postman GET /refunds): _id, claimId,
// transactionId, brandId, subBrandId, claimCode, requestedAmount,
// split { vendorClawback, vendorPromoReversal, isFullRefund }, status,
// isOpen, reason, reasonNote, method, vendorRespondBy, createdAt,
// updatedAt, statusLabel, canDecide, canWithdraw.
function mapRefundRow(r) {
  const split = r.split || {};
  return {
    refundId: r._id,
    claimId: r.claimId || "—",
    claimCode: r.claimCode || "—",
    transactionId: r.transactionId || "—",
    requestedAmount: formatINR(r.requestedAmount),
    vendorClawback: split.vendorClawback != null ? formatINR(split.vendorClawback) : "—",
    vendorPromoReversal: split.vendorPromoReversal != null ? formatINR(split.vendorPromoReversal) : "—",
    refundType: split.isFullRefund == null ? "—" : split.isFullRefund ? "Full" : "Partial",
    respondBy: formatDate(r.vendorRespondBy),
    reason: humanize(r.reason),
    reasonNote: r.reasonNote || "",
    method: humanize(r.method),
    createdOn: formatDate(r.createdAt),
    updatedOn: formatDate(r.updatedAt),
    status: r.statusLabel || humanize(r.status),
    statusCode: r.status || "",
    isOpen: !!r.isOpen,
    canDecide: !!r.canDecide,
    raw: r,
  };
}

/**
 * Fetches refunds (up to `limit`) and maps them into table rows.
 * @param {Object} [opts] forwarded to getRefunds (open, etc.)
 * @returns {Promise<{rows: Object[], total: number}>}
 */
export async function fetchRefundOverview(opts = {}) {
  const res = await getRefunds({ limit: 100, ...opts });
  // Confirmed envelope: { data: { total, totalPages, page, limit, data: [...] } }
  const list = res?.data?.data ?? [];
  return {
    rows: list.map(mapRefundRow),
    total: res?.data?.total ?? list.length,
  };
}

export default {
  getRefunds,
  approveRefund,
  rejectRefund,
  fetchRefundOverview,
};
