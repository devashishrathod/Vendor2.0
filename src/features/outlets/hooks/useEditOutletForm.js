import { useEffect, useState } from "react";
import { updateSubBrand } from "../services/subBrandApi";
import {
  createLocation,
  updateLocation,
  buildLocationPayloadFromPlace,
  buildLocationPayloadFromSavedLocation,
  validateLocationPayload,
  getAllLocations,
  mapLocationToSelectedPlace,
} from "../services/locationApi";

// Turns a subBrand doc's embedded `location` (confirmed shape — see
// locationApi.js's mapLocationToSelectedPlace) into the same
// `{ name, address, lat, lng, addressComponents, source }` shape the
// location-picker UI already works with, so the "current location" can be
// shown/replaced the same way a fresh Google pick is.
function existingLocationToPlace(loc) {
  if (!loc) return null;
  const [lng, lat] = loc.geo?.coordinates || loc.coordinates || [];
  return {
    name: loc.addressLine1 || loc.formattedAddress || "Saved Location",
    address:
      loc.formattedAddress ||
      [loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", "),
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    addressComponents: null,
    source: "existing",
  };
}

// Edits an EXISTING outlet — outletType/isActive via subBrands/update, and
// (only if the merchant actually picks a new address) its location via
// locations/update. Unlike useAddOutletForm, there's no WhatsApp OTP step
// here — the outlet is already verified — and location changes are staged
// locally and only sent on "Save Changes", not persisted the moment a place
// is picked. The location UI itself is the same one Add Outlet uses (Search
// / Live tabs + saved locations).
export function useEditOutletForm(outlet, onSuccess) {
  const raw = outlet?.raw || {};
  const existingLocation = raw.location || null;
  const brandId = raw.brandId;

  const [outletType, setOutletType] = useState((outlet?.outletType || "").toLowerCase());
  const [isActive, setIsActive] = useState(raw.isActive !== false);
  const [location, setLocationState] = useState(existingLocationToPlace(existingLocation));
  const [locationChanged, setLocationChanged] = useState(false);
  const [locationMode, setLocationMode] = useState("search");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Brand's previously-saved addresses (GET /locations) — same list Add
  // Outlet offers.
  const [savedLocations, setSavedLocations] = useState([]);
  const [loadingSavedLocations, setLoadingSavedLocations] = useState(!!brandId);
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    getAllLocations({ brandId, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.data ?? res?.data ?? [];
        setSavedLocations(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setSavedLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSavedLocations(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // A new pick from Search / Live. `null` (the card's Clear) goes back to
  // the outlet's current location instead of leaving it empty.
  const setLocation = (place) => {
    if (!place) {
      resetLocation();
      return;
    }
    setLocationState(place);
    setLocationChanged(true);
  };

  // A saved address — keeps the original doc on the pick so submit can
  // build its payload from that (it has no Google address_components).
  const selectSavedLocation = (loc) => {
    setLocationState({ ...mapLocationToSelectedPlace(loc), savedDoc: loc });
    setLocationChanged(true);
  };

  const resetLocation = () => {
    setLocationState(existingLocationToPlace(existingLocation));
    setLocationChanged(false);
  };

  const submit = async () => {
    if (!outlet?.id) return;
    setSubmitting(true);
    setError("");
    try {
      await updateSubBrand(outlet.id, {
        outletType: outletType.toUpperCase(),
        isActive,
      });

      if (locationChanged && location) {
        const overrides = { subBrandId: outlet.id, brandId: brandId || undefined };
        const payload = location.savedDoc
          ? buildLocationPayloadFromSavedLocation(location.savedDoc, overrides)
          : buildLocationPayloadFromPlace(location, overrides);
        const errors = validateLocationPayload(payload, { requireSubBrandId: true });
        if (errors.length) {
          throw new Error(`This location is missing ${errors.join(", ")}. Try picking a more specific result.`);
        }

        const locationId = raw.locationId || existingLocation?._id;
        if (locationId) {
          await updateLocation(locationId, payload);
        } else {
          await createLocation(payload);
        }
      }

      setSuccessMessage("Outlet updated successfully.");
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Couldn't update the outlet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    outletType,
    setOutletType,
    isActive,
    setIsActive,
    location,
    locationChanged,
    setLocation,
    selectSavedLocation,
    resetLocation,
    locationMode,
    setLocationMode,
    savedLocations,
    loadingSavedLocations,
    submit,
    submitting,
    error,
    clearError: () => setError(""),
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(""),
  };
}
