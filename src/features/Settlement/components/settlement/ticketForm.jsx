// src/components/settlement/ticketForm.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download, ImageDown, X } from "lucide-react";

function TicketRow({ ticket, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => onToggle(ticket.id)}
        className="flex w-full items-center justify-between px-6 py-3.5 text-left"
      >
        <span className="text-sm text-slate-600">
          Ticket Id: <span className="font-medium text-slate-800">{ticket.id}</span>{" "}
          <span className="text-slate-400">[{ticket.date}]</span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {isOpen && (ticket.customerInfo || ticket.nextSteps) && (
        <div className="space-y-4 px-6 pb-5">
          {ticket.customerInfo && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Customer Information
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {ticket.customerInfo}
              </p>
            </div>
          )}

          {ticket.nextSteps && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Next Steps
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{ticket.nextSteps}</p>
            </div>
          )}

          {ticket.resources?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Resources
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Purpose strings must clearly identify the app being used to access this data,
                and describe how the app uses the data in a way that is easy for the reader to
                understand.
              </p>
              <div className="mt-3 space-y-2">
                {ticket.resources.map((res) => (
                  <div
                    key={res.label}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-600">{res.label}</span>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
                      {res.action === "Screenshots" ? (
                        <ImageDown className="h-3.5 w-3.5" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {res.action}
                    </button>
                  </div>
                ))}
              </div>
              {ticket.footnote && (
                <p className="mt-3 text-xs text-indigo-600 underline underline-offset-2">
                  {ticket.footnote}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewTicketModal({ open, onClose, onSubmit, submitting }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    await onSubmit?.({ subject, message });
    setSubject("");
    setMessage("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Create Ticket</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Settlement amount mismatch"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketForm({
  tickets = [],
  expandedTicket,
  toggleTicket,
  formOpen,
  onCloseForm,
  onSubmit,
  submitting,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ticket Raise
        </h3>
      </div>

      {tickets.length === 0 ? (
        <p className="px-6 py-6 text-sm text-slate-400">No tickets raised yet.</p>
      ) : (
        <div>
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              isOpen={expandedTicket === ticket.id}
              onToggle={toggleTicket}
            />
          ))}
        </div>
      )}

      <NewTicketModal
        open={formOpen}
        onClose={onCloseForm}
        onSubmit={onSubmit}
        submitting={submitting}
      />
    </div>
  );
}
