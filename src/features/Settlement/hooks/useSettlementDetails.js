// src/hooks/useSettlementDetails.js
import { useCallback, useEffect, useState } from "react";
import {
  getSettlementById,
  getSettlementTransactions,
  raiseTicket,
} from "../services/settlementService";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// ⚠️ Field names below are a best-effort mapping — no sample JSON response
// was shared yet for GET /settlements/:id or GET /settlements/:id/
// transactions, only the requests. This keeps the exact same shape the
// page's original UI expects (breakup/transactionInfo), defaulting every
// field this response can't confirm to 0/"—"/"Not found" instead of
// hiding the section or inventing a plausible-looking number. Paste real
// responses to correct any of this.
function mapSettlementDetail(s, transactions) {
  const first = Array.isArray(transactions) ? transactions[0] : null;
  return {
    settlementId: s.settlementId || s._id || "—",
    status: s.status || "Not found",
    toCreditAmount: s.toCreditAmount ?? s.amount ?? 0,
    settlementBankName: s.settlementBankName || s.bankName || "—",
    settlementAccountNo: s.settlementAccountNo || s.accountNumber || "—",
    breakup: {
      discountSummary: s.breakup?.discountSummary ?? 0,
      bestPackSummary: s.breakup?.bestPackSummary ?? 0,
      membershipSummary: s.breakup?.membershipSummary ?? 0,
      gstSummary: s.breakup?.gstSummary ?? 0,
      processingFee: s.breakup?.processingFee ?? 0,
      serviceFee: s.breakup?.serviceFee ?? 0,
      verified: !!s.verified,
    },
    transactionInfo: {
      collectionPayment: {
        dateTime: formatDate(first?.createdAt),
        paymentPlatform: first?.paymentPlatform || "—",
        paymentStructure: first?.paymentStructure || "—",
      },
      vendorPayout: {
        dateTime: formatDate(s.payoutAt),
        creditBank: s.settlementBankName || s.bankName || "—",
      },
      settlementDone: {
        dateTime: formatDate(s.settledAt),
        settlementTransactionId: s.settlementTransactionId || "—",
        transactionId: first?.transactionId || "—",
      },
    },
    raw: s,
  };
}

export default function useSettlementDetails(settlementId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!settlementId) return;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, txnRes] = await Promise.all([
        getSettlementById(settlementId),
        getSettlementTransactions(settlementId),
      ]);
      const raw = detailRes?.data ?? detailRes ?? {};
      const txnList = txnRes?.data?.data ?? txnRes?.data ?? [];
      setDetail(mapSettlementDetail(raw, Array.isArray(txnList) ? txnList : []));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [settlementId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTicket = useCallback((ticketId) => {
    setExpandedTicket((prev) => (prev === ticketId ? null : ticketId));
  }, []);

  // ⚠️ No confirmed ticket-raising endpoint exists yet — surfaces that
  // honestly by rejecting instead of pretending the ticket was created.
  const submitTicket = useCallback(async (payload) => {
    setSubmitting(true);
    try {
      const res = await raiseTicket({ settlementId, ...payload });
      await load();
      return res;
    } finally {
      setSubmitting(false);
    }
  }, [settlementId, load]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op if clipboard is unavailable
    }
  }, []);

  return {
    detail,
    loading,
    error,
    tickets: [], // no confirmed endpoint yet — always empty, not fabricated
    expandedTicket,
    toggleTicket,
    submitTicket,
    submitting,
    copyToClipboard,
    refresh: load,
  };
}
