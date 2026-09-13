import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Wallet, Tag, ShoppingBag, CreditCard, User, Activity, LifeBuoy } from "lucide-react";
// import RaiseTicketModal from "../components/RaiseTicketModal";
import { getOrderById, TYPE_CONFIG } from "../data/transactionData";
import { getVoucherClaimPaymentById, mapPaymentToOrderDetail } from "../services/transactionService";
import { getVoucherById } from "@/features/voucher/services/voucher/VoucherService";
import VoucherViewModal from "../components/VoucherViewModal";
import ReceiptModal from "../components/ReceiptModal";

function formatVoucherDate(iso) {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Small reusable "label above value" cell used across every section.
// Falls back to "Not Found" for a genuinely missing value instead of
// rendering an empty cell — the field itself always shows, per the
// as-it-was layout, rather than being hidden when the API has no data.
function Field({ label, value, valueClass = "text-gray-900", action }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-sm ${valueClass} whitespace-pre-line`}>{value ?? "Not Found"}</p>
        {action}
      </div>
    </div>
  );
}

// Copy-to-clipboard icon button, used next to ids throughout the page
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-300 hover:text-gray-500 transition-colors"
      aria-label="Copy"
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

// Section wrapper: icon-tile card header (matching the icon+title pattern
// used across Outlet Details/Settings/Subscription elsewhere in the app)
// instead of a bare uppercase heading floating on the page background.
function Section({ icon: Icon, iconBg = "bg-emerald-50", iconText = "text-emerald-500", title, subtitle, children }) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconText}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

// One ticket row inside "Ticket Raise" — collapsible, matches the
// expand/collapse chevron behaviour from the screenshot
function TicketItem({ ticket }) {
  const [open, setOpen] = useState(!!ticket.open);
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <svg
          width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          className={`text-gray-400 transition-transform duration-150 flex-shrink-0 ${open ? "rotate-90" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm text-gray-700">
          Ticket Id : <span className="font-medium">{ticket.id}</span>{" "}
          <span className="text-gray-400">({ticket.date})</span>
        </span>
      </button>

      {open && ticket.subject && (
        <div className="px-4 pb-5 pl-10 space-y-4">
          <p className="text-sm font-bold text-gray-900">{ticket.subject}</p>
          <p className="text-sm text-gray-700">{ticket.description}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{ticket.details}</p>

          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Next Steps</p>
            <p className="text-sm text-gray-600 leading-relaxed">{ticket.nextSteps}</p>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Resources</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{ticket.resources}</p>
            <div className="space-y-1">
              {ticket.attachments?.map((a, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {a.label}{" "}
                  <button className="text-blue-500 hover:underline font-medium">{a.fileLabel}</button>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Detail Page ─────────────────────────────────────────────────────
// Route: /transactions/order/:orderId
// Table me Order Id pe click karne se yahan aata hai.
// getOrderById() saare tabs (voucher/dealpack/membership) me se order dhoondta
// hai, isliye ye ek hi detail page teeno transaction types ko handle karta hai
// — lekin ab har type apna alag "TYPE INFORMATION" section, title, tag line
// aur badge dikhata hai (typeConfig ke through), instead of hamesha voucher
// wale fields dikhane ke.
export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Dummy dealpack/membership orders are still looked up synchronously by
  // their "#..." code — unchanged. A real voucher row's link now routes on
  // the payment's actual _id (see TransactionOverview.jsx), which never
  // matches that dummy map, so it falls through to the real API fetch below.
  const dummyResult = getOrderById(`#${orderId}`);

  const [realResult, setRealResult] = useState(null);
  const [loading, setLoading] = useState(!dummyResult);
  const [notFound, setNotFound] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (dummyResult) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getVoucherClaimPaymentById(orderId)
      .then(async (res) => {
        if (cancelled) return;
        // Confirmed real shape: { success, message, data: { payment, claim,
        // brand, outlet, viewer } } — NOT a flat payment record.
        const data = res?.data ?? res;
        if (!data?.payment) { setNotFound(true); return; }
        const order = mapPaymentToOrderDetail(data);

        // Published/Expired come from the full voucher record, not the
        // claim/payment — same GET /vouchers/versions/get-all the "View
        // Page" modal uses. Fetched alongside (not blocking): if it fails,
        // the two fields just stay blank rather than the whole page erroring.
        try {
          const voucherRes = await getVoucherById(order.refId);
          const version = voucherRes?.data?.data?.[0];
          if (!cancelled && version) {
            order.publishedDate = formatVoucherDate(version.startAt);
            order.expiredDate = formatVoucherDate(version.endAt);
            // Countdown to expiry, computed client-side from the real
            // endAt — there's no separate "reminder days" field on the
            // API, but this is exactly what that label means: days left
            // before the voucher expires. Clamped at 0 once it's past.
            if (version.endAt) {
              const daysLeft = Math.ceil((new Date(version.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              order.reminderDays = `${Math.max(daysLeft, 0)} Days`;
            }
          }
        } catch (err) {
          console.error("Failed to load voucher publish/expiry dates:", err.message);
        }

        if (!cancelled) {
          setRealResult({ order, typeConfig: TYPE_CONFIG.voucher });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load transaction details:", err.message);
        setNotFound(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const result = dummyResult || realResult;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (!result || notFound) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500 mb-4">Order #{orderId} not found.</p>
          <button
            onClick={() => navigate("/transactions")}
            className="text-emerald-600 font-semibold hover:underline text-sm"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const { order, typeConfig } = result;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Header card: back, title, status badges, actions */}
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-wrap items-center gap-4 px-5 sm:px-6 py-5">
          <button
            onClick={() => navigate("/transactions")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-[240px]">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {order.title || order.refId}
            </h1>
            {order.tagLine && (
              <p className="text-xs text-gray-500 mt-0.5">{order.tagLine}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-500">Order Id</span>
              <span className="text-xs font-semibold text-gray-700">{order.orderId}</span>
              <CopyButton text={order.orderId} />
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {order.status || "Active"}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {typeConfig.badgeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Create Ticket — not needed right now, commented out. */}
            {/* <button className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2.5">
              Create Ticket
            </button> */}
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-lg px-4 py-2.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Receipt
            </button>
          </div>
        </div>

        {/* Billing Information */}
        <Section icon={Wallet} iconBg="bg-emerald-50" iconText="text-emerald-500" title="Billing Information">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">To Paid</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold text-gray-900">{order.paidAmount}</p>
                <Download className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-emerald-500 mt-1">Payment Successful!</p>
            </div>
            <Field label="Outlet Location" value={order.outlet} />
            <Field label="Store Id" value={order.storeId} />
            <Field label="Store Type" value={order.storeType} />
          </div>
        </Section>

        {/* Type Information — dynamic: Voucher / Deal Pack / Membership,
            driven entirely by typeConfig so each transaction type shows
            its own relevant fields under its own heading. */}
        <Section icon={Tag} iconBg="bg-blue-50" iconText="text-blue-500" title={typeConfig.sectionTitle}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
            <Field
              label={typeConfig.idFieldLabel}
              value={order.refId}
              action={
                typeConfig === TYPE_CONFIG.voucher && (
                  <>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => setShowVoucherModal(true)}
                      className="text-xs text-blue-500 hover:underline font-medium"
                    >
                      View Page
                    </button>
                  </>
                )
              }
            />
            {typeConfig.fields.map((f) => (
              <Field key={f.key} label={f.label} value={order[f.key]} />
            ))}
          </div>
        </Section>

        {/* Purchase Summary */}
        <Section icon={ShoppingBag} iconBg="bg-violet-50" iconText="text-violet-500" title="Purchase Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
            <Field label="Bill Amount" value={order.billAmount} />
            <Field label="Discount Amount" value={order.discountAmount} valueClass="text-gray-900" />
            <Field label="Trydood Discount" value={order.trydoodDiscount} />
            {/* <Field label="Membership Discount" value={order.membershipDiscount} valueClass={order.membershipDiscount ? "text-emerald-500 font-semibold" : "text-gray-900"} /> */}
            <Field label="Coupon Code" value={order.couponCode} />
            <Field label="Paid Amount" value={order.paidAmount} />
          </div>
        </Section>

        {/* Payments Information */}
        <Section icon={CreditCard} iconBg="bg-sky-50" iconText="text-sky-500" title="Payments Information">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
            <Field label="Payment Method" value={order.paymentMethod} />
            <Field label="Payment options" value={order.paymentOptions} />
            <Field label="Payment Via" value={order.paymentVia} />
          </div>
        </Section>

        {/* Customer Information */}
        {(order.customerName || order.customerCode || order.customerEmail || order.customerNote) && (
          <Section icon={User} iconBg="bg-amber-50" iconText="text-amber-500" title="Customer Information" subtitle={order.customerNote}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
              {order.customerName && <Field label="Customer Name" value={order.customerName} />}
              {order.customerCode && <Field label="Customer Id" value={order.customerCode} />}
              {order.customerEmail && <Field label="Mail Id" value={order.customerEmail} />}
            </div>
          </Section>
        )}

        {/* Transaction Information */}
        <Section
          icon={Activity}
          iconBg="bg-emerald-50"
          iconText="text-emerald-500"
          title="Transaction Information"
          subtitle={
            <button className="flex items-center gap-1 text-blue-500 hover:underline">
              <span>Time Line</span>
              <span className="text-gray-400 font-normal">(Track all activities and updates easily.)</span>
            </button>
          }
        >
          <div className="space-y-6">
            {/* Payment transaction row */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6 flex-1">
                <Field
                  label="Payment Transaction Id"
                  value={order.paymentTransactionId}
                  action={<CopyButton text={order.paymentTransactionId} />}
                />
                <Field label="Date & Time" value={order.paymentDateTime} />
                <Field label="Pay Via" value={order.payVia} />
                <Field label="Recived Account Info" value={order.receivedAccountInfo} />
              </div>
            </div>

            {/* Settlement row — no settlement id/date/account exists yet
                on a real voucher claim's payment record, only on the
                still-dummy dealpack/membership entries, so this whole
                row is skipped rather than showing four blank fields. */}
            {order.settlementId && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6 flex-1">
                  <Field
                    label="Settlement Done"
                    value={order.settlementId}
                    valueClass="text-blue-500 font-medium"
                    action={<CopyButton text={order.settlementId} />}
                  />
                  <Field label="Date & Time" value={order.settlementDateTime} />
                  <Field label="Settlement Transaction ID" value={order.settlementTransactionId} />
                  <Field label="Settlement Account Info" value={order.settlementAccountInfo} />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Ticket Raise */}
        {order.tickets?.length > 0 && (
          <Section icon={LifeBuoy} iconBg="bg-rose-50" iconText="text-rose-500" title="Ticket Raise">
            <div className="space-y-2">
              {order.tickets.map((t, i) => (
                <TicketItem key={i} ticket={t} />
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-gray-800">TRYDOOD RETAIL PRIVATE LIMITED</p>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <span>Copyright © 2026 Trydood. All rights reserved.</span>
            <button className="hover:text-gray-600">Terms of Service</button>
            <button className="hover:text-gray-600">Privacy Policy</button>
            <button className="hover:text-gray-600">Contact Us</button>
          </div>
        </div>
      </div>

      {showVoucherModal && (
        <VoucherViewModal
          voucherId={order.refId}
          onClose={() => setShowVoucherModal(false)}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          order={order}
          typeConfig={typeConfig}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
