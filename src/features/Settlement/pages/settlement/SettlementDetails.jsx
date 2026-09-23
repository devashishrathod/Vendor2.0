// src/pages/settlement/SettlementDetails.jsx
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Download,
  PlusCircle,
  CheckCircle2,
  Landmark,
  Clock,
} from "lucide-react";
import { TicketForm } from "../../components/settlement";
import useSettlementDetails from "../../hooks/useSettlementDetails";


const currency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function InfoField({ label, value, copyable, onCopy }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{value}</p>
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
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
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
    tickets,
    expandedTicket,
    toggleTicket,
    submitTicket,
    submitting,
    copyToClipboard,
  } = useSettlementDetails(settlementId);
  const [formOpen, setFormOpen] = useState(false);

  if (loading || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF7] dark:bg-gray-900 text-sm text-slate-400">
        Loading settlement details…
      </div>
    );
  }

  const { breakup, legs, timeline } = detail;

  return (
   <div>
 
     <div className="min-h-screen bg-[#F8FAF7] dark:bg-gray-900 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/settlements")}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-800 dark:text-gray-100">{detail.settlementNumber}</h1>
              <button
                onClick={() => copyToClipboard(detail.settlementNumber)}
                className="text-slate-300 hover:text-slate-500"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Ticket
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700">
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
                {detail.statusLabel}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField
                label="Net Payable"
                value={currency(breakup.netPayable)}
                copyable
                onCopy={copyToClipboard}
              />
              <InfoField label="Settlement Cycle" value={detail.cycleType} />
              <InfoField label="Period" value={`${detail.periodStart} – ${detail.periodEnd}`} />
              <InfoField label="Transaction Count" value={detail.transactionCount} />
              <InfoField label="Settlement Bank" value={detail.bankName} />
              <InfoField label="Account No." value={detail.bankLast4 !== "—" ? `•••• ${detail.bankLast4}` : "—"} />
              <InfoField label="Approved At" value={detail.approvedAt} />
              <InfoField label="Paid At" value={detail.paidAt} />
            </div>
          </SectionCard>

          {/* Amount breakup */}
          <SectionCard title="Amount Breakup Information">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField label="Gross Collected" value={currency(breakup.grossCollected)} />
              <InfoField label="Vendor Promo Cost" value={currency(breakup.vendorPromoCost)} />
              <InfoField label="Commission Amount" value={currency(breakup.commissionAmount)} />
              <InfoField label="Commission Tax" value={currency(breakup.commissionTax)} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <InfoField label="Commission Deduction" value={currency(breakup.commissionDeduction)} />
              <InfoField label="Refund Adjustment" value={currency(breakup.refundAdjustment)} />
              <InfoField label="Chargeback Adjustment" value={currency(breakup.chargebackAdjustment)} />
              <InfoField
                label="Reserve Held"
                value={
                  breakup.reserveReason === "DISABLED"
                    ? "Not applicable"
                    : `${currency(breakup.reserveHeld)} (${breakup.reservePercent}%)`
                }
              />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Net Payable
              </p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {currency(breakup.netPayable)}
              </p>
            </div>
          </SectionCard>

          {/* Settlement legs — the actual bank-transfer attempt(s) that pay this settlement out */}
          <SectionCard title="Settlement Legs">
            {legs.length === 0 ? (
              <p className="text-sm text-slate-400">No settlement legs yet.</p>
            ) : (
              <div className="space-y-5">
                {legs.map((leg) => (
                  <div
                    key={leg.id}
                    className="flex items-start gap-3 pt-5 first:pt-0"
                  >
                    <span className="mt-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                      <Landmark className="h-4 w-4" />
                    </span>
                    <div className="grid flex-1 grid-cols-2 gap-y-3 gap-x-6 sm:grid-cols-4">
                      <InfoField label="Leg" value={`#${leg.legNumber}`} />
                      <InfoField label="Amount" value={currency(leg.amount)} />
                      <InfoField label="Status" value={leg.status} />
                      <InfoField label="Mode" value={leg.mode} />
                      <InfoField label="UTR" value={leg.utr} copyable onCopy={copyToClipboard} />
                      <InfoField label="Provider" value={leg.provider} />
                      <InfoField label="Bank" value={leg.bankLast4 !== "—" ? `•••• ${leg.bankLast4}` : "—"} />
                      <InfoField label="Initiated / Paid" value={`${leg.initiatedAt} → ${leg.paidAt}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Timeline — real status-change audit trail */}
          <SectionCard title="Timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-400">No status history yet.</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-slate-100 dark:bg-gray-700 p-2 text-slate-500 dark:text-gray-300">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-gray-100">
                        {event.fromStatus} → {event.toStatus}
                      </p>
                      <p className="text-xs text-slate-400">{event.at} · by {event.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
