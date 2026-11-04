import { useState } from "react";
import { upsertWorkHours } from "../services/subBrandApi";
import { toEditorHours, validateHours, toPayloadHours } from "../utils/workHours";

/**
 * Add / edit ONE outlet's working hours via POST /workHours/upsert with the
 * outlet's own id (subBrandId). Upsert — the same call creates the hours
 * the first time and updates them after.
 * @param {object} outlet - mapped outlet from useOutletDetails (`id` + `raw`)
 * @param {() => void} [onSuccess]
 */
export function useEditOutletWorkHours(outlet, onSuccess) {
  const existing = outlet?.raw?.workHours || null;

  const [hours, setHoursState] = useState(() => toEditorHours(existing));
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setHours = (next) => {
    setHoursState(next);
    setChanged(true);
  };

  const submit = async () => {
    if (!outlet?.id) return;
    const problem = validateHours(hours);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await upsertWorkHours({ subBrandId: outlet.id, hours: toPayloadHours(hours) });
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Couldn't save the working hours. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    hours,
    setHours,
    isNew: !existing,
    // A brand-new outlet can save the defaults straight away; an existing
    // schedule only needs saving once something was actually changed.
    canSave: !existing || changed,
    submit,
    submitting,
    error,
    clearError: () => setError(""),
  };
}
