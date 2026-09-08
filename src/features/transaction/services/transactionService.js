import axios from 'axios';

// ── Base URL ────────────────────────────────────────────────
// Matches the Postman env variable {{base_url}} — this project's actual
// env var is VITE_BASE_URL (see src/config/index.js), not VITE_API_BASE_URL.
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Axios instance ──────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
});

// Attach auth token automatically (same pattern as onboarding's verify.api.js
// / locationApi.js). The real authStore in this project lives under
// features/onboarding/store/authStore.js and stores the token as `token`,
// not `accessToken` — using either the wrong path or the wrong field name
// here silently sends every request with no Authorization header at all.
api.interceptors.request.use(async (config) => {
    const { useAuthStore } = await import('../../onboarding/store/authStore');
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Normalize error responses so callers get a consistent shape
function handleError(error) {
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong. Please try again.';
    throw new Error(message);
}

/* -------------------------------------------------------------------------
 * Voucher Claims — the "Transactions" page's real data source: each row
 * is a voucher redeemed by a customer at an outlet.
 * ---------------------------------------------------------------------- */

// ── Get All Voucher Claims ────────────────────────────────────────
// GET {{base_url}}/voucher-claims?page=&limit=&status=&outletId=&from=&to=
export async function getVoucherClaims({
    page = 1,
    limit = 20,
    brandId,
    status,
    outletId,
    from,
    to,
} = {}) {
    try {
        const params = { page, limit };
        if (brandId) params.brandId = brandId;
        if (status) params.status = status;
        if (outletId) params.outletId = outletId;
        if (from) params.from = from;
        if (to) params.to = to;
        const { data } = await api.get('/voucher-claims', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get All Voucher Claim Payments ────────────────────────────────
// GET {{base_url}}/voucher-claims/payments?page=&limit=&brandId=&outletId=&voucherId=
// brandId is required to scope results to the logged-in vendor's own
// brand — same convention as getVouchers/getSubBrands elsewhere in this
// codebase. Without it the query has nothing to filter by and the table
// comes back empty even when the vendor has real voucher claims. voucherId
// narrows it down to just one voucher's payments (used by the Voucher
// Details page's "Transaction Information" tab).
export async function getVoucherClaimPayments({ page = 1, limit = 20, brandId, outletId, voucherId } = {}) {
    try {
        const params = { page, limit };
        if (brandId) params.brandId = brandId;
        if (outletId) params.outletId = outletId;
        if (voucherId) params.voucherId = voucherId;
        const { data } = await api.get('/voucher-claims/payments', { params });
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get One Voucher Claim Payment ─────────────────────────────────
// GET {{base_url}}/voucher-claims/payments/:claimTransactionId
export async function getVoucherClaimPaymentById(claimTransactionId) {
    try {
        if (!claimTransactionId) throw new Error('claimTransactionId is required');
        const { data } = await api.get(`/voucher-claims/payments/${claimTransactionId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Get One Voucher Claim — full timeline (payment + claim + brand + outlet)
// GET {{base_url}}/voucher-claims/:claimId
export async function getVoucherClaimById(claimId) {
    try {
        if (!claimId) throw new Error('claimId is required');
        const { data } = await api.get(`/voucher-claims/${claimId}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

// ── Verify a Claim by its human-readable code (counter verification) ─────
// GET {{base_url}}/voucher-claims/code/:claimCode
export async function getVoucherClaimByCode(claimCode) {
    try {
        if (!claimCode) throw new Error('claimCode is required');
        const { data } = await api.get(`/voucher-claims/code/${claimCode}`);
        return data;
    } catch (error) {
        handleError(error);
    }
}

/* -------------------------------------------------------------------------
 * Mapping helpers — turn the confirmed real GET /voucher-claims/payments
 * shape (flat payment fields: amount, status, paymentMethod, createdAt,
 * razorpayPaymentId, invoiceId, plus nested voucher/brand/outlet objects)
 * into the exact shape TransactionOverview.jsx already renders
 * (sectionTitle/idLabel/overviewStats/rows — see data/transactionData.js's
 * TRANSACTION_DATA.voucher), so the table/UI code needs zero changes.
 * ---------------------------------------------------------------------- */

const formatINR = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// There is NO customer name/phone on the payment record — only
// `customerId` — so the row shows that id as a reference code instead of
// inventing a name.
function mapPaymentRow(p) {
  const customerRef = p.customerId ? `#${String(p.customerId).slice(-8).toUpperCase()}` : "—";
  return {
    orderId: p.invoiceId || p._id,
    // The real lookup key for GET /voucher-claims/payments/:claimTransactionId
    // — the record's own _id. `orderId` above (invoiceId) is only a display
    // code and isn't guaranteed to be queryable by that endpoint, so the
    // detail-page LINK routes on this instead (see TransactionOverview.jsx).
    txnId: p._id,
    customerName: customerRef,
    customerCode: customerRef,
    customerPhone: "",
    // Confirmed from a real response: this endpoint's `voucher` object is
    // { claimId, billAmount, offerDiscount, netBill, vendorPayable,
    // vendorPromoCost, commissionAmount } — no version-code field anywhere
    // on it (that only exists on the separate GET /vouchers/versions/get-all
    // response), so this column shows the plain voucherId instead.
    refId: p.voucherId || p.voucher?.voucherId || "—",
    razorpayOrderId: p.razorpayOrderId || "—",
    createdOn: formatDate(p.createdAt),
    outlet: p.outlet?.storeId || p.outlet?.uniqueId || "—",
    amount: formatINR(p.amount),
    // Razorpay's own status vocabulary ("captured", "failed", "refunded",
    // "created"/"authorized") — only "captured" reads as a completed
    // payment, matching the table's existing Paid/else color logic.
    status: p.status === "captured" ? "Paid" : (p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Pending"),
    paymentMethod: p.paymentMethod || "—",
    billAmount: formatINR(p.voucher?.billAmount),
    offerDiscount: formatINR(p.voucher?.offerDiscount),
    netBill: formatINR(p.voucher?.netBill),
    paidAmount: formatINR(p.amount),
    discountAmount: formatINR(-(p.voucher?.offerDiscount || 0)),
    additionalDiscount: formatINR(0),
    gstAmount: formatINR(0),
    raw: p,
  };
}

// Maps the real GET /voucher-claims/payments/:claimTransactionId response
// into the field set OrderDetail.jsx's existing JSX already reads
// (order.title/refId/outlet/storeId/billAmount/... — see TYPE_CONFIG.voucher
// in data/transactionData.js). Confirmed real shape (very different from a
// flat payment record — this is `data: { payment, claim, brand, outlet,
// viewer } }`): most of the actually-useful detail (voucher name, discount
// breakdown, outlet snapshot) lives on `claim`, not `payment`.
//
// `viewer.canSeeCustomerContact` comes back `false` for a vendor — there is
// no customer name/email/phone anywhere in this response at all, which
// confirms that's a deliberate scope restriction, not a missing field, so
// none of the Customer Information fields are filled in here.
//
// Fields the API genuinely has no equivalent for (store type, published/
// expired dates, reminder days, coupon code, settlement id/date, tickets)
// are left undefined rather than invented — the existing <Field> cells just
// render blank for those instead of the page crashing or showing made-up
// data.
export function mapPaymentToOrderDetail(data) {
  const payment = data?.payment || {};
  const claim = data?.claim || {};
  const outlet = claim.outletSnapshot || data?.outlet || {};
  const pricing = claim.pricing || {};

  return {
    title: claim.voucherSnapshot?.name,
    tagLine: pricing.offerTitle ? `${pricing.offerTitle} OFF` : undefined,
    orderId: payment.invoiceId || payment._id,
    // Confirmed from a real response: there's no version-code field
    // anywhere on `claim` or `claim.voucherSnapshot` either (same as the
    // list endpoint's `voucher` object) — this stays the plain voucherId.
    refId: payment.voucherId || claim.voucherId || "—",
    voucherName: claim.voucherSnapshot?.name,
    percentage: pricing.offerTitle,
    // Confirmed real field — REDEEMED/etc, replaces what used to be a
    // hardcoded "Active" badge in OrderDetail.jsx's header.
    status: claim.status,
    // Real location signal confirmed on this endpoint's outlet
    // snapshot is just `state` (e.g. "karnataka") — no full street
    // address/city field exists, so that's shown here (capitalized),
    // not the outlet's uniqueId (that's an id, not a location).
    outlet: outlet.state ? outlet.state.charAt(0).toUpperCase() + outlet.state.slice(1) : undefined,
    storeId: outlet.storeId || "—",
    billAmount: formatINR(pricing.billAmount ?? payment.voucher?.billAmount),
    discountAmount: formatINR(-(pricing.offerDiscount ?? payment.voucher?.offerDiscount ?? 0)),
    // "Best Value" ~ the real amount the customer saved on this claim.
    bestValue: pricing.youSaved != null ? formatINR(pricing.youSaved) : undefined,
    paidAmount: formatINR(payment.amount),
    paymentMethod: payment.paymentMethod || "—",
    // Explains WHY Customer Name/Id/Mail Id below are blank — this isn't a
    // missing-data gap, viewer.canSeeCustomerContact is false for a vendor
    // account and the API returns no customer field at all for that reason.
    customerNote: "Customer contact details aren't visible to vendor accounts for this claim.",
    paymentTransactionId: payment.razorpayPaymentId || payment._id,
    paymentDateTime: formatDate(payment.createdAt),
    payVia: payment.paymentMethod || "—",
    receivedAccountInfo: "Trydood Account",
    tickets: [],
  };
}

/**
 * Fetches every voucher claim payment (across pages, up to `limit`) and
 * maps it into the exact shape TRANSACTION_DATA.voucher used to hard-code
 * (see data/transactionData.js) — sectionTitle/idLabel/overviewStats/rows —
 * so TransactionOverview.jsx's existing render logic needs zero changes.
 * @param {Object} [opts] forwarded to getVoucherClaimPayments (outletId, etc.)
 */
export async function fetchVoucherTransactionOverview(opts = {}) {
  const res = await getVoucherClaimPayments({ limit: 100, ...opts });
  const payments = res?.data?.data ?? [];
  const rows = payments.map(mapPaymentRow);

  const sum = (fn) => payments.reduce((acc, p) => acc + (fn(p) || 0), 0);

  return {
    sectionTitle: "Voucher Overview",
    idLabel: "Voucher Id",
    overviewStats: [
      { label: "Overall Bill Value", value: formatINR(sum((p) => p.voucher?.billAmount)) },
      { label: "Overall Paid Amount", value: formatINR(sum((p) => p.amount)) },
      { label: "Discount Amount", value: formatINR(-sum((p) => p.voucher?.offerDiscount)), negative: true },
      { label: "Additional discount", value: formatINR(0), negative: true },
      { label: "Gst Amount", value: formatINR(0) },
    ],
    rows,
    // Raw (non-display-formatted) totals for the page header / summary
    // card, which need the real number rather than a pre-formatted string.
    // `total` comes from the list envelope (total across ALL pages), so it
    // stays correct even though only up to `limit` rows are fetched here.
    totalPaidAmount: sum((p) => p.amount),
    count: res?.data?.total ?? payments.length,
  };
}

// Maps one payment record into the row shape VoucherTransactionInfo.jsx's
// table expects (Order Id / Customer / Outlet / Store Type / Date & Time /
// Status / Payment Details). There's no customer name on this record —
// only `customerId` (same limitation as mapPaymentRow above) — and no
// per-payment `storeType` either (the payment's own embedded `outlet` only
// has uniqueId/storeId, not the outlet's type), so both show "—" rather
// than a fabricated value; the "Sub-Brand"/"Franchise" filter tabs won't
// have anything real to filter on until the API adds that field.
function mapPaymentToVoucherTransactionRow(p) {
  const customerRef = p.customerId ? `#${String(p.customerId).slice(-8).toUpperCase()}` : "—";
  const created = p.createdAt ? new Date(p.createdAt) : null;
  return {
    orderId: p.invoiceId || p._id,
    customerName: customerRef,
    customerId: customerRef,
    outletName: p.outlet?.uniqueId || "—",
    storeId: p.outlet?.storeId || "—",
    storeType: "—",
    date: created && !Number.isNaN(created.getTime())
      ? created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—",
    time: created && !Number.isNaN(created.getTime())
      ? created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : "—",
    status: p.status === "captured" ? "Success" : (p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Pending"),
    amount: p.amount,
  };
}

/**
 * GET /voucher-claims/payments?voucherId=&brandId= — every real payment
 * for ONE specific voucher, for the Voucher Details page's "Transaction
 * Information" tab. Maps into { summary, rows } matching
 * VoucherTransactionInfo.jsx's props exactly.
 * @param {string} voucherId
 * @param {Object} [opts] forwarded to getVoucherClaimPayments (brandId, etc.)
 */
export async function fetchVoucherTransactionsByVoucherId(voucherId, opts = {}) {
  const res = await getVoucherClaimPayments({ limit: 100, voucherId, ...opts });
  const payments = res?.data?.data ?? [];
  const rows = payments.map(mapPaymentToVoucherTransactionRow);

  const sum = (fn) => payments.reduce((acc, p) => acc + (fn(p) || 0), 0);
  const uniqueCustomers = new Set(payments.map((p) => p.customerId).filter(Boolean));

  return {
    summary: {
      overallEarnings: sum((p) => p.amount),
      overallBillAmount: sum((p) => p.voucher?.billAmount),
      discountAmount: sum((p) => p.voucher?.offerDiscount),
      paidAmount: sum((p) => p.amount),
      totalUserCount: uniqueCustomers.size,
    },
    rows,
  };
}

export default {
    getVoucherClaims,
    mapPaymentToOrderDetail,
    getVoucherClaimPayments,
    getVoucherClaimPaymentById,
    getVoucherClaimById,
    getVoucherClaimByCode,
    fetchVoucherTransactionOverview,
    fetchVoucherTransactionsByVoucherId,
};
