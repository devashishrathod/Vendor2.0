import { useCallback, useEffect, useState } from "react";
import { addKycDocument, deleteKycDocument, getKycDocuments, updateKycDocument } from "../services/onboardingApi";
import { useOnboardingStatusStore } from "../store/statusStore";

/**
 * The brand's KYC documents on the server (API doc #23b–#23e): the list
 * (owner ID first, then business documents), `hints` (docType codes for
 * chips), `limit` and `count` (business documents only). Every change
 * re-reads the list — `fileUrl` links are short-lived — and the onboarding
 * status (items.documents / documentCount).
 */
export function useKycDocuments() {
  const fetchStatus = useOnboardingStatusStore((s) => s.fetchStatus);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State is only set once the request settles.
  const reload = useCallback(
    () =>
      getKycDocuments()
        .then((res) => {
          setList(res?.data ?? null);
          setError(null);
        })
        .catch((err) => {
          console.error("Documents fetch failed:", err);
          setError(err);
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const afterChange = useCallback(async () => {
    await reload();
    fetchStatus().catch((err) => console.error("Onboarding status refresh failed:", err));
  }, [fetchStatus, reload]);

  /** @param {{ title: string, docType?: string|null, file: File }} input */
  const add = useCallback(
    async (input) => {
      await addKycDocument(input);
      await afterChange();
    },
    [afterChange],
  );

  /** @param {string} id @param {{ title?: string, file?: File }} changes */
  const update = useCallback(
    async (id, changes) => {
      await updateKycDocument(id, changes);
      await afterChange();
    },
    [afterChange],
  );

  /** @param {string} id */
  const remove = useCallback(
    async (id) => {
      await deleteKycDocument(id);
      await afterChange();
    },
    [afterChange],
  );

  const documents = list?.documents ?? [];
  return {
    loading,
    error,
    reload,
    ownerId: documents.find((d) => d.purpose === "OWNER_ID") ?? null,
    businessDocuments: documents.filter((d) => d.purpose === "BUSINESS"),
    hints: list?.hints ?? [],
    limit: list?.limit ?? null,
    count: list?.count ?? 0,
    add,
    update,
    remove,
  };
}
