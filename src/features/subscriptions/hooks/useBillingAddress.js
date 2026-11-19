import { useCallback, useEffect, useState } from "react";
import { geocodeAddress } from "@/features/oulet/New folder/services/googleMapsService";
import { getBillingAddress, saveBillingAddress } from "../services/billingAddressApi";

/**
 * A server address (billing / suggested / GST) as the billing form's fields.
 * @param {object|null|undefined} a
 * @returns {{ line1: string, line2: string, city: string, state: string, pin: string }|null}
 */
export function toFormAddress(a) {
  if (!a) return null;
  return {
    line1: a.addressLine1 ?? "",
    line2: a.addressLine2 || a.landmark || "",
    city: a.city || a.district || "",
    state: a.state ?? "",
    pin: a.zipcode ?? "",
  };
}

const oneLine = (parts) => [parts.line1, parts.line2, parts.city, parts.state, parts.pin].map((p) => String(p ?? "").trim()).filter(Boolean).join(", ");

/**
 * The brand's billing address (GET / PUT /brands/billing-address). Saving
 * geocodes the address for `coordinates` ([lng, lat], required by the
 * server) — the form has no map pin.
 */
export function useBillingAddress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(
    () =>
      getBillingAddress()
        .then((res) => {
          setData(res?.data ?? null);
          setError(null);
        })
        .catch((err) => {
          console.error("Billing address fetch failed:", err);
          setError(err);
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * @param {{ line1: string, line2: string, city: string, state: string, pin: string }} parts
   * @returns {Promise<object>} the saved billing address
   */
  const save = useCallback(async (parts) => {
    let coordinates;
    try {
      const place = await geocodeAddress(oneLine(parts));
      const location = place?.geometry?.location;
      coordinates = [location.lng(), location.lat()];
    } catch (geoError) {
      console.error("Billing address geocode failed:", geoError);
      throw new Error("We couldn't find this address on the map. Please check it and try again.", { cause: geoError });
    }
    const res = await saveBillingAddress({
      addressLine1: parts.line1.trim(),
      ...(parts.line2.trim() ? { addressLine2: parts.line2.trim() } : {}),
      city: parts.city.trim(),
      state: parts.state.trim(),
      zipcode: parts.pin.trim(),
      coordinates,
    });
    const saved = res?.data?.billingAddress ?? null;
    setData((d) => ({ ...(d ?? {}), billingAddress: saved, suggestedAddress: null }));
    return saved;
  }, []);

  return {
    loading,
    error,
    reload,
    save,
    billingAddress: data?.billingAddress ?? null,
    suggestedAddress: data?.suggestedAddress ?? null,
    gstAddress: data?.gstAddress ?? null,
    gstin: data?.gstin ?? null,
  };
}
