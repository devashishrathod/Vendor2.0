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

function mapPaymentRow(p) {
  const customerName = p.customer?.fullName || "—";
  const customerCode = p.customer?.uniqueId || "—";
  return {
    orderId: p.invoiceId || p._id,
    // The real lookup key for GET /voucher-claims/payments/:claimTransactionId
    // — the record's own _id. `orderId` above (invoiceId) is only a display
    // code and isn't guaranteed to be queryable by that endpoint, so the
    // detail-page LINK routes on this instead (see TransactionOverview.jsx).
    txnId: p._id,
    customerName,
    customerCode,
    customerPhone: "",
    refId: p.voucherVersion?.versionCode || p.voucherVersion?._id || "—",
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
    // Real confirmed field (see the `voucher` object shape noted above) —
    // the vendor's own promo cost, shown as its own "Promo Discount" column.
    promoDiscount: formatINR(p.voucher?.vendorPromoCost),
    netBill: formatINR(p.voucher?.netBill),
    paidAmount: formatINR(p.amount),
    discountAmount: formatINR(-(p.voucher?.offerDiscount || 0)),
    additionalDiscount: formatINR(0),
    gstAmount: formatINR(0),
    raw: p,
  };
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// "Outlet Location" in Billing Information — city, district, state,
// country + zipcode from outletDetail.address, joined into one readable
// line, instead of just the single city/state it showed before.
function formatOutletLocation(address) {
  if (!address) return undefined;
  const parts = [address.city, address.district, address.state, address.country]
    .filter(Boolean)
    .map(capitalize);
  const line = parts.join(", ");
  return address.zipcode ? [line, address.zipcode].filter(Boolean).join(" - ") : line || undefined;
}

export function mapPaymentToOrderDetail(data) {
  const payment = data?.payment || {};
  const claim = data?.claim || {};
  const outlet = claim.outletSnapshot || data?.outlet || {};
  const pricing = claim.pricing || {};
  // The confirmed GET /voucher-claims/payments/:id response also has a
  // richer top-level `pricing` object (fees, GST, refund) alongside
  // claim.pricing's slimmer summary — used below only for the fields
  // claim.pricing doesn't have, so nothing already wired above changes.
  const fullPricing = data?.pricing || {};
  const customer = data?.customer || {};
  const voucherVersion = data?.voucherVersion || data?.voucher?.version || {};
  const paymentInfo = data?.paymentInfo || {};
  const paymentMethod = paymentInfo.method || {};
  const settlement = data?.settlement || {};
  const outletDetail = data?.outletDetail || {};
  const outletAddress = outletDetail.address || {};

  return {
    title: claim.voucherSnapshot?.name,
    tagLine: pricing.offerTitle,
    orderId: payment.invoiceId || payment._id,
    voucherId: payment.voucherId || claim.voucherId || data?.voucher?.voucherId || "—",
    voucherVersionId: voucherVersion._id || data?.voucher?.voucherVersionId || "—",
    refId: voucherVersion.versionCode || voucherVersion._id || "—",
    voucherName: claim.voucherSnapshot?.name,
    percentage: pricing.offerTitle || (pricing.offerDiscountValue != null ? `${pricing.offerDiscountValue}%` : undefined),
    status: claim.status,
    outlet: formatOutletLocation(outletAddress) || (outlet.state ? capitalize(outlet.state) : undefined),
    storeId: outlet.storeId || "—",
    storeType: outletDetail.outletType || "—",
    // Outlet Information — real fields from outletDetail (address, contact,
    // status), not the thinner claim.outletSnapshot/data.outlet objects
    // that only carry storeId/uniqueId/state.
    outletUniqueId: outletDetail.uniqueId || outlet.uniqueId || "—",
    outletWhatsapp: outletDetail.whatsappNumber || "—",
    outletDescription: outletDetail.description?.trim() || "—",
    outletFormattedAddress: outletAddress.formattedAddress || "—",
    outletCity: outletAddress.city ? capitalize(outletAddress.city) : "—",
    outletState: outletAddress.state ? capitalize(outletAddress.state) : "—",
    outletZipcode: outletAddress.zipcode || "—",
    outletJoinedDate: outletDetail.joinedDate
      ? new Date(outletDetail.joinedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—",
    outletStatus: outletDetail.isActive === false ? "Inactive" : (outletDetail.isActive ? "Active" : "—"),
    // Claim Code — the human-readable redemption code, shown nowhere else
    // on this page today (see claim.claimCode in the confirmed response).
    claimCode: claim.claimCode || "—",
    billAmount: formatINR(pricing.billAmount ?? payment.voucher?.billAmount),
    discountAmount: formatINR(-(pricing.offerDiscount ?? payment.voucher?.offerDiscount ?? 0)),
    bestValue: pricing.youSaved != null ? formatINR(pricing.youSaved) : undefined,
    trydoodDiscount: formatINR(-(pricing.vendorPromoCost ?? payment.voucher?.vendorPromoCost ?? 0)),
    couponCode: pricing.promoCode || "—",
    // Convenience fee + GST — from the richer top-level `pricing` object;
    // "Not Applicable" when GST genuinely isn't enabled on this order,
    // never a fabricated ₹0.00. Commission fields are deliberately NOT
    // surfaced anywhere on this page — viewer.canSeePlatformCosts is false
    // for a vendor, meaning the platform's own cut isn't meant for them.
    convenienceFee: fullPricing.convenienceFee != null ? formatINR(fullPricing.convenienceFee) : undefined,
    gstAmount: fullPricing.isGstEnabled ? formatINR(fullPricing.gstAmount) : "Not Applicable",
    refundStatus: fullPricing.isRefunded
      ? `${fullPricing.refundStatus || "Refunded"} · ${formatINR(fullPricing.amountRefunded)}`
      : undefined,
    paidAmount: formatINR(payment.amount ?? pricing.totalPayable),
    paymentMethod: payment.paymentMethod || "—",
    paymentOptions: paymentMethod.type || payment.paymentMethod || "—",
    paymentVia: paymentMethod.bank || paymentMethod.wallet || paymentMethod.vpa || paymentMethod.type || "—",
    customerName: customer.fullName || "—",
    customerCode: customer.uniqueId || "—",
    customerEmail: customer.email || "—",
    customerNote: data?.viewer?.canSeeCustomerContact === false
      ? "Customer contact details aren't visible to vendor accounts for this claim."
      : undefined,
    paymentTransactionId: paymentInfo.gatewayPaymentId || payment.razorpayPaymentId || payment._id,
    paymentDateTime: formatDate(paymentInfo.createdAt || payment.createdAt),
    payVia: paymentInfo.method?.type || payment.paymentMethod || "—",
    receivedAccountInfo: "Trydood Account",
    publishedDate: voucherVersion.startAt,
    expiredDate: voucherVersion.endAt,
    reminderDays: voucherVersion.endAt
      ? `${Math.max(Math.ceil((new Date(voucherVersion.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0)} Days`
      : undefined,
    settlementId: settlement.record?._id || settlement.state,
    settlementDateTime: settlement.paidToVendorAt ? formatDate(settlement.paidToVendorAt) : undefined,
    settlementTransactionId: settlement.record?.transactionId,
    settlementAccountInfo: settlement.state || "—",
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

function mapPaymentToVoucherTransactionRow(p) {
  const customerName = p.customer?.fullName || "—";
  const customerId = p.customer?.uniqueId || "—";
  const created = p.createdAt ? new Date(p.createdAt) : null;
  return {
    orderId: p.invoiceId || p._id,
    customerName,
    customerId,
    voucherVersionId: p.voucherVersion?.versionCode || p.voucherVersion?._id || "—",
    outletName: p.outlet?.uniqueId || "—",
    storeId: p.outlet?.storeId || "—",
    storeType: p.outlet?.outletType || "—",
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
  const uniqueCustomers = new Set(payments.map((p) => p.customer?.uniqueId).filter(Boolean));

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
