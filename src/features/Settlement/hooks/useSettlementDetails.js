// src/hooks/useSettlementDetails.js
import { useCallback, useEffect, useState } from "react";
import { fetchSettlementDetails, raiseTicket } from "../services/settlementService";

export default function useSettlementDetails(settlementId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSettlementDetails(settlementId);
      setDetail(data);
      if (data.tickets?.length) {
        setExpandedTicket(data.tickets[data.tickets.length - 1].id);
      }
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
    expandedTicket,
    toggleTicket,
    submitTicket,
    submitting,
    copyToClipboard,
    refresh: load,
  };
}
