import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
// import RaiseTicketModal from "../components/RaiseTicketModal";
import { getOrderById } from "../data/transactionData";

// Small reusable "label above value" cell used across every section
function Field({ label, value, valueClass = "text-gray-900", action }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-sm ${valueClass} whitespace-pre-line`}>{value}</p>
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

// Section wrapper: uppercase, letter-spaced heading + white card, matches
// "BILLING INFORMATION" / "VOUCHER INFORMATION" style in the reference design
function Section({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-bold tracking-[0.15em] text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-xs text-blue-500 font-medium mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
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

  const result = getOrderById(`#${orderId}`);

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <DashboardHeader />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500 mb-4">Order #{orderId} not found.</p>
          <button
            onClick={() => navigate(-1)}
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
      <DashboardHeader />

      <div className="w-full mx-auto px-6 py-6">
        {/* <div className="bg-white border border-gray-100 rounded-xl"> */}
        <div className="">
          {/* Header row: back, title, status badges, actions */}
          <div className="flex flex-wrap items-center gap-4 px-6 py-5 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-gray-200 text-gray-600 flex-shrink-0"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
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
                  Active
                </span>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {typeConfig.badgeLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2.5">
                Create Ticket
              </button>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-lg px-4 py-2.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download Receipt
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Billing Information */}
            <Section title="BILLING INFORMATION">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-1">To Paid</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-bold text-gray-900">{order.paidAmount}</p>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-emerald-500 mt-1">Payment Successful!</p>
                </div>
                <Field label="Outlet Location" value={order.outlet} />
                <Field label="Store Id" value={order.storeId} />
                <Field label="Store Type" value={order.storeType} />
              </div>
            </Section>
            <hr className="p-6" />

            {/* Type Information — dynamic: Voucher / Deal Pack / Membership,
                driven entirely by typeConfig so each transaction type shows
                its own relevant fields under its own heading. */}
            <Section title={typeConfig.sectionTitle}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                <Field
                  label={typeConfig.idFieldLabel}
                  value={order.refId}
                  action={
                    typeConfig.withViewPage && (
                      <>
                        <span className="text-gray-300">·</span>
                        <button className="text-xs text-blue-500 hover:underline font-medium">View Page</button>
                      </>
                    )
                  }
                />
                {typeConfig.fields.map((f) => (
                  <Field key={f.key} label={f.label} value={order[f.key]} />
                ))}
              </div>
            </Section>

            <hr className="p-6" />

            {/* Purchase Summary */}
            <Section title="PURCHASE SUMMARY">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                <Field label="Bill Amount" value={order.billAmount} />
                <Field label="Discount Amount" value={order.discountAmount} valueClass="text-gray-900" />
                <Field label="Trydood Discount" value={order.trydoodDiscount} />
                <Field label="Membership Discount" value={order.membershipDiscount} valueClass="text-emerald-500 font-semibold" />
                <Field label="Coupon Code" value={order.couponCode} />
                <Field label="Paid Amount" value={order.paidAmount} />
              </div>
            </Section>

            <hr className="p-6" />

            {/* Payments Information */}
            <Section title="PAYMENTS INFORMATION">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                <Field label="Payment Method" value={order.paymentMethod} />
                <Field label="Payment options" value={order.paymentOptions} />
                <Field label="Payment Via" value={order.paymentVia} />
              </div>
            </Section>

            <hr className="p-6" />

            {/* Customer Information */}
            <Section title="CUSTOMER INFORMATION" subtitle={order.customerNote}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                <Field label="Customer Name" value={order.customerName} />
                <Field label="Customer Id" value={order.customerCode} />
                <Field label="Mail Id" value={order.customerEmail} />
              </div>
            </Section>

            <hr className="p-6" />

            {/* Transaction Information */}
            <Section
              title="TRANSACTION INFORMATION"
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

                {/* Settlement row */}
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
              </div>
            </Section>
            <hr className="p-6" />

            {/* Ticket Raise */}
            {order.tickets?.length > 0 && (
              <Section title="TICKET RAISE">
                <div className="space-y-2">
                  {order.tickets.map((t, i) => (
                    <TicketItem key={i} ticket={t} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.1em] text-gray-800">TRYDOOD RETAIL PRIVATE LIMITED</p>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <span>Copyright © 2026 Trydood. All rights reserved.</span>
            <button className="hover:text-gray-600">Terms of Service</button>
            <button className="hover:text-gray-600">Privacy Policy</button>
            <button className="hover:text-gray-600">Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}