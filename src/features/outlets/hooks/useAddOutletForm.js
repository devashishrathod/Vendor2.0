import { useState } from "react";
import { addOutlet } from "../services/outletService";
import { REGISTRATION_TYPES } from "../constants/outletConstants";

const initialState = {
  outletName: "",
  outletAddress: "",
  registrationType: REGISTRATION_TYPES.SUB_BRAND,
  registeredWith: "",
};

export function useAddOutletForm(onSuccess) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => setForm(initialState);

  const submit = async () => {
    if (!form.outletName.trim() || !form.outletAddress.trim() || !form.registeredWith) {
      setError("Please fill in outlet name, address, and who it's registered with.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const created = await addOutlet(form);
      reset();
      onSuccess?.(created);
    } catch (err) {
      setError("Couldn't save the outlet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return { form, update, submit, submitting, error, reset };
}
