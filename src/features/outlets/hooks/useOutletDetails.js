import { useEffect, useState } from "react";
import { fetchOutletById, fetchOutletTransactions } from "../services/outletService";

export function useOutletDetails(id) {
  const [outlet, setOutlet] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [outletData, txData] = await Promise.all([fetchOutletById(id), fetchOutletTransactions(id)]);
        if (!cancelled) {
          setOutlet(outletData);
          setTransactions(txData);
        }
      } catch (err) {
        if (!cancelled) setError("Couldn't load this outlet's details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { outlet, transactions, loading, error };
}
