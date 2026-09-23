// src/hooks/useSettlementDetails.js
import { useCallback, useEffect, useState } from "react";
import {
  getSettlementById,
  raiseTicket,
} from "../services/settlementService";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// Confirmed real response for GET /settlements/:id — { data: { settlement,
// legs, timeline, viewer } }. `settlement` carries the payout's own totals
// (grossCollected/commission*/refundAdjustment/.../netPayable) and a bank
// snapshot; `legs` are the actual bank-transfer attempts (UTR/mode/
// provider) that pay it out — usually one, but the shape supports more;
// `timeline` is the real status-change audit trail (DRAFT →
// PENDING_APPROVAL → APPROVED → PROCESSING → PAID). This replaces the
// previous best-effort guess (discountSummary/bestPackSummary/... and a
// separate GET /settlements/:id/transactions call) now that a real sample
// confirms none of those fields exist — everything the page needs comes
// back in this one call.
function mapSettlementDetail(payload) {
  const s = payload?.settlement || {};
  const legs = Array.isArray(payload?.legs) ? payload.legs : [];
  const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];

  return {
    id: s._id,
    settlementNumber: s.settlementNumber || "—",
    status: s.status || "—",
    statusLabel: s.statusLabel || s.status || "—",
    cycleType: s.cycleType || "—",
    periodStart: formatDate(s.periodStart),
    periodEnd: formatDate(s.periodEnd),
    createdAt: formatDate(s.createdAt),
    approvedAt: formatDate(s.approvedAt),
    paidAt: formatDate(s.paidAt),
    transactionCount: s.transactionCount ?? 0,
    bankName: s.bankSnapshot?.bankName || "—",
    bankLast4: s.bankSnapshot?.accountLast4Digits || "—",
    breakup: {
      grossCollected: s.grossCollected ?? 0,
      vendorPromoCost: s.vendorPromoCost ?? 0,
      commissionAmount: s.commissionAmount ?? 0,
      commissionTax: s.commissionTax ?? 0,
      commissionDeduction: s.commissionDeduction ?? 0,
      refundAdjustment: s.refundAdjustment ?? 0,
      chargebackAdjustment: s.chargebackAdjustment ?? 0,
      reserveHeld: s.reserveHeld ?? 0,
      reservePercent: s.reservePercent ?? 0,
      reserveReleased: s.reserveReleased ?? 0,
      reserveReason: s.reserveBasis?.reason || null,
      netPayable: s.netPayable ?? 0,
    },
    legs: legs.map((l) => ({
      id: l._id,
      legNumber: l.legNumber,
      amount: l.amount ?? 0,
      status: l.status || "—",
      utr: l.utr || "—",
      mode: l.mode || "—",
      provider: l.provider || "—",
      bankLast4: l.bankLast4 || "—",
      initiatedAt: formatDate(l.initiatedAt),
      paidAt: formatDate(l.paidAt),
    })),
    timeline: timeline.map((t) => ({
      at: formatDate(t.at),
      fromStatus: t.fromStatus || "—",
      toStatus: t.toStatus || "—",
      by: t.by || "—",
    })),
    raw: payload,
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
      const res = await getSettlementById(settlementId);
      const payload = res?.data ?? res ?? {};
      setDetail(mapSettlementDetail(payload));
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
