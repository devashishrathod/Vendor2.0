import { useState } from "react";
import { addOutlet } from "../services/outletService";

const initialState = {
  // ── Added: Outlet Type (Outlet vs Franchise), same concept as the
  // CreateBrandOutlet page.
  outletType: "", // "outlet" | "franchise"

  // ── Added: Outlet WhatsApp Number, verified via OTP (or copied + verified
  // from the brand's own number).
  whatsapp: {
    number: "",
    isBrandNumber: false,
    verified: false,
  },

  // ── Added: Outlet Location, picked via Google Places search or live
  // geolocation — same shape as CreateBrandOutlet's `selectedPlace`.
  locationMode: "search", // "search" | "live"
  location: null, // { name, address, lat, lng, placeId, addressComponents, source }
};

export function useAddOutletForm(onSuccess) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Patches the nested `whatsapp` object instead of replacing it outright,
  // so callers can update just `number`, `verified`, etc. one at a time.
  const updateWhatsapp = (patch) =>
    setForm((prev) => ({ ...prev, whatsapp: { ...prev.whatsapp, ...patch } }));

  const setLocation = (location) => setForm((prev) => ({ ...prev, location }));

  const reset = () => setForm(initialState);

  const submit = async () => {
    if (!form.outletType || !form.whatsapp.verified || !form.location) {
      setError("Please pick an outlet type, verify a WhatsApp number, and select a location.");
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

  return { form, update, updateWhatsapp, setLocation, submit, submitting, error, reset };
}