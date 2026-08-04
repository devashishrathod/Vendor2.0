// src/pages/settlement/SettlementDetails.jsx
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Download,
  PlusCircle,
  CheckCircle2,
  BadgeCheck,
  CreditCard,
  Landmark,
  Banknote,
} from "lucide-react";
import { TicketForm } from "../../components/settlement";
import useSettlementDetails from "../../hooks/useSettlementDetails";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";

const currency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function InfoField({ label, value, copyable, onCopy }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-sm font-medium text-slate-800">{value}</p>
        {copyable && (
          <button onClick={() => onCopy?.(value)} className="text-slate-300 hover:text-slate-500">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function SettlementDetails() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const {
    detail,
    loading,
    expandedTicket,
    toggleTicket,
    submitTicket,
    submitting,
    copyToClipboard,
  } = useSettlementDetails(settlementId);
  const [formOpen, setFormOpen] = useState(false);

  if (loading || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-400">
        Loading settlement details…
      </div>
    );
  }

  const { breakup, transactionInfo, tickets } = detail;

  return (
   <div>
    <DashboardHeader/>
     <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800">{detail.settlementId}</h1>
              <button
                onClick={() => copyToClipboard(detail.settlementId)}
                className="text-slate-300 hover:text-slate-500"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Ticket
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700">
              <Download className="h-3.5 w-3.5" />
              Download Report
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Settlement information */}
          <SectionCard
            title="Settlement Information"
            action={
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {detail.status}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField
                label="To Credit Amount"
                value={currency(detail.toCreditAmount)}
                copyable
                onCopy={copyToClipboard}
              />
              <InfoField
                label="Settlement Id"
                value={detail.settlementId}
                copyable
                onCopy={copyToClipboard}
              />
              <InfoField label="Settlement Bank Name" value={detail.settlementBankName} />
              <InfoField label="Settlement Account No" value={detail.settlementAccountNo} />
            </div>
          </SectionCard>

          {/* Amount breakup */}
          <SectionCard title="Amount Breakup Information">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField label="Discount Summary" value={currency(breakup.discountSummary)} />
              <InfoField label="Best Pack Summary" value={currency(breakup.bestPackSummary)} />
              <InfoField label="Membership Summary" value={currency(breakup.membershipSummary)} />
              <InfoField label="GST Summary" value={currency(breakup.gstSummary)} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField label="Processing Fee" value={currency(breakup.processingFee)} />
              <InfoField label="Service Fee" value={currency(breakup.serviceFee)} />
              <div className="col-span-2">
                <p className="text-xs text-slate-400">Your Transfer Amount was less than expected</p>
                {breakup.verified && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Transaction information */}
          <SectionCard
            title="Transaction Information"
            action={
              <button className="text-xs font-medium text-indigo-600 hover:underline">
                Price List (Check all updates cost.)
              </button>
            }
          >
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-indigo-50 p-2 text-indigo-600">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div className="grid flex-1 grid-cols-1 gap-y-1 gap-x-6 sm:grid-cols-3">
                  <InfoField label="Date & Time" value={transactionInfo.collectionPayment.dateTime} />
                  <InfoField label="Payment Platform" value={transactionInfo.collectionPayment.paymentPlatform} />
                  <InfoField label="Payment Structure" value={transactionInfo.collectionPayment.paymentStructure} />
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
                <span className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-600">
                  <Landmark className="h-4 w-4" />
                </span>
                <div className="grid flex-1 grid-cols-1 gap-y-1 gap-x-6 sm:grid-cols-3">
                  <InfoField label="Date & Time" value={transactionInfo.vendorPayout.dateTime} />
                  <InfoField label="Credit Bank" value={transactionInfo.vendorPayout.creditBank} />
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
                <span className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Banknote className="h-4 w-4" />
                </span>
                <div className="grid flex-1 grid-cols-1 gap-y-1 gap-x-6 sm:grid-cols-3">
                  <InfoField label="Date & Time" value={transactionInfo.settlementDone.dateTime} />
                  <InfoField
                    label="Settlement Transaction ID"
                    value={transactionInfo.settlementDone.settlementTransactionId}
                  />
                  <InfoField label="Transaction Id" value={transactionInfo.settlementDone.transactionId} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Ticket raise */}
          <TicketForm
            tickets={tickets}
            expandedTicket={expandedTicket}
            toggleTicket={toggleTicket}
            formOpen={formOpen}
            onCloseForm={() => setFormOpen(false)}
            onSubmit={submitTicket}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
   </div>
  );
}
