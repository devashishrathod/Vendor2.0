import { useState, useRef, useEffect, useCallback } from "react";
import { useAddOutletForm } from "../hooks/useAddOutletForm";
import { useBrand } from "../../../hooks/useBrand"; // ← path apne project ke hisaab se adjust karo
import { sendOutletWhatsappOtp, loginOrSignUpWithWhatsapp, verifyOtpWhatsapp } from "../services/subBrandApi"; // ← real API
import ErrorToast from "@/components/common/ErrorToast";
import SuccessToast from "@/components/common/SuccessToast";

const inputBase =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

// ─── Outlet Type options (Outlet vs Franchise) ─────────────────────────────
// Kept local to this file since it's only used here + in CreateBrandOutlet.
// Move to constants/outletConstants.js if you want a single shared source.
const OUTLET_TYPE_OPTIONS = [
  { value: "outlet", label: "Outlet" },
  { value: "franchise", label: "Franchise" },
];

// ─── Google Maps config ─────────────────────────────────────────────────────
// Same key/loader logic as CreateBrandOutlet — duplicated here so this modal
// is self-contained. Pull this into a shared `lib/googleMaps.js` if both
// files end up in the same bundle, so the script only loads once.
const GOOGLE_MAPS_API_KEY = "AIzaSyBmg8zWrXA_taDUSrpWRN2sbd7csdPgKLM";

let googleMapsLoadingPromise = null;
function loadGoogleMapsScript() {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

function textSearchPlaces(query) {
  return loadGoogleMapsScript().then(
    (google) =>
      new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.textSearch({ query }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        });
      })
  );
}

function getPlaceDetails(placeId) {
  return loadGoogleMapsScript().then(
    (google) =>
      new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          { placeId, fields: ["name", "formatted_address", "geometry", "address_component"] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error(`Place details fetch failed: ${status}`));
            }
          }
        );
      })
  );
}

function reverseGeocode(lat, lng) {
  return loadGoogleMapsScript().then(
    (google) =>
      new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      })
  );
}

const isValidPhone = (v) => /^[0-9]{10}$/.test((v || "").replace(/\D/g, ""));

// ─── Map Preview Modal ─────────────────────────────────────────────────────────
function MapModal({ lat, lng, label, onClose }) {
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">{label || "Map Preview"}</p>
            <p className="text-xs text-gray-500">Lat: {lat} · Lng: {lng}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <iframe
          title="Outlet Map"
          src={mapSrc}
          width="100%"
          height="420"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors">
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp OTP Verify Modal ─────────────────────────────────────────────────
function OtpVerifyModal({ phone, otpValue, onOtpChange, otpError, onConfirm, onClose, onResend, resending, confirming }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Verify WhatsApp Number</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3 3-3-3z" />
            </svg>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            We've sent a 6-digit OTP over WhatsApp to{" "}
            <span className="font-semibold text-gray-900">{phone}</span>. Enter it below to verify this number.
          </p>

          <input
            type="text"
            autoFocus
            value={otpValue}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConfirm();
              }
            }}
            placeholder="Enter OTP"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-gray-800"
          />

          {otpError && <p className="text-xs text-red-500 mt-2">{otpError}</p>}

          <button
            onClick={onResend}
            disabled={resending}
            className="text-xs font-semibold text-emerald-600 hover:underline mt-3 disabled:opacity-50 disabled:no-underline"
          >
            {resending ? "Resending…" : "Didn't get it? Resend OTP"}
          </button>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={otpValue.length < 4 || confirming}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              otpValue.length >= 4 && !confirming
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {confirming ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shows the "location saved / saving / error" status under a picked place,
// plus — when the error is specifically a missing zipcode — an inline
// pincode input so the merchant can fix it in place instead of hitting a
// dead end and having to search again.
function LocationSaveStatus({ locationSaving, locationSaved, locationError, onRetryZipcode }) {
  const [manualZipcode, setManualZipcode] = useState("");
  const [retrying, setRetrying] = useState(false);
  const isZipcodeIssue = !!locationError && locationError.toLowerCase().includes("zipcode");

  const handleRetry = async () => {
    if (!manualZipcode.trim() || !onRetryZipcode) return;
    setRetrying(true);
    await onRetryZipcode(manualZipcode.trim());
    setRetrying(false);
  };

  if (locationSaving) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Saving this location…
      </p>
    );
  }

  if (locationSaved) {
    return (
      <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Location saved
      </p>
    );
  }

  if (!locationError) return null;

  return (
    <div className="mt-2">
      <p className="flex items-start gap-1.5 text-xs text-rose-500">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {locationError}
      </p>

      {isZipcodeIssue && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={manualZipcode}
            onChange={(e) => setManualZipcode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit pincode"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-gray-700"
          />
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying || manualZipcode.trim().length < 4}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              retrying || manualZipcode.trim().length < 4
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {retrying ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Outlet Location Search (Google Places Text Search + Place Details) ───────
function OutletLocationSearch({ selectedPlace, onSelectPlace, onShowMap, locationSaving, locationSaved, locationError, onRetryZipcode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript().catch(() => {
      // silently ignore here — surfaced properly when the user actually searches
    });
  }, []);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setError("");
    setHasSearched(true);
    try {
      const places = await textSearchPlaces(trimmed);
      setResults(places);
    } catch (err) {
      setError("Couldn't fetch results. Check your connection and try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  const pickPlace = async (place) => {
    if (!place.place_id) return;
    setDetailsLoading(true);
    setError("");
    try {
      const details = await getPlaceDetails(place.place_id);
      const loc = details.geometry?.location;
      if (!loc) {
        setError("This place has no location data. Try another result.");
        return;
      }
      onSelectPlace({
        name: details.name,
        address: details.formatted_address,
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
        placeId: place.place_id,
        addressComponents: details.address_components || [],
        source: "search",
      });
      setResults([]);
      setQuery("");
      setHasSearched(false);
    } catch (err) {
      setError("Couldn't fetch details for that place. Try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Find Your Outlet Location Using Google Maps.</p>
          <p className="text-xs text-gray-400 mt-0.5">Search your outlet name and city, then pick it from the results.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="eg : Toni & Guy Ahmedabad"
          className={inputBase}
        />
        <button
          onClick={runSearch}
          disabled={searching || !query.trim()}
          className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            searching || !query.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-500 mb-3">{error}</p>}

      {results.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => pickPlace(place)}
              disabled={detailsLoading}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50/50 transition-colors flex items-start gap-3 disabled:opacity-60"
            >
              <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                <span className="block text-sm font-semibold text-gray-800">{place.name}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{place.formatted_address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {detailsLoading && <p className="text-xs text-gray-400 mb-4">Fetching place details…</p>}

      {hasSearched && !searching && results.length === 0 && !error && (
        <p className="text-xs text-gray-400 mb-4">No matches found. Try a different search term.</p>
      )}

      {selectedPlace ? (
        <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Selected Outlet Location</p>
          <p className="text-sm font-bold text-gray-900">{selectedPlace.name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{selectedPlace.address}</p>

          {/* ── Location save status — this is its OWN API call, fired the
              moment the place was picked, independent of the final Save
              Outlet button. ── */}
          <LocationSaveStatus
            locationSaving={locationSaving}
            locationSaved={locationSaved}
            locationError={locationError}
            onRetryZipcode={onRetryZipcode}
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={onShowMap}
              className="flex-1 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-colors"
            >
              Show on Google Map
            </button>
            <button
              onClick={() => onSelectPlace(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">Search above and select your outlet to pin its location</p>
      )}
    </div>
  );
}

// ─── Live Location Picker (Geolocation + Reverse Geocoding) ───────────────────
function LiveLocationPicker({ selectedPlace, onSelectPlace, onShowMap, locationSaving, locationSaved, locationError, onRetryZipcode }) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't supported by this browser.");
      return;
    }

    setFetching(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await reverseGeocode(latitude, longitude);
          onSelectPlace({
            name: "Current Location",
            address: result.formatted_address,
            lat: latitude,
            lng: longitude,
            placeId: result.place_id,
            addressComponents: result.address_components || [],
            source: "live",
          });
        } catch (err) {
          setError("Got your location, but couldn't resolve an address. Try again.");
        } finally {
          setFetching(false);
        }
      },
      (err) => {
        setFetching(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission was denied. Allow location access in your browser to use this.");
        } else if (err.code === err.TIMEOUT) {
          setError("Timed out getting your location. Try again.");
        } else {
          setError("Couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Use Your Live Location</p>
          <p className="text-xs text-gray-400 mt-0.5">Allow location access from your browser and we'll auto-detect your outlet's address.</p>
        </div>
      </div>

      <button
        onClick={useMyLocation}
        disabled={fetching}
        className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
          fetching
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-emerald-500 text-white hover:bg-emerald-600"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {fetching ? "Fetching your location…" : "Use My Current Location"}
      </button>

      {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

      {selectedPlace?.source === "live" ? (
        <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-4 mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Detected Address</p>
          <p className="text-sm text-gray-800">{selectedPlace.address}</p>

          <LocationSaveStatus
            locationSaving={locationSaving}
            locationSaved={locationSaved}
            locationError={locationError}
            onRetryZipcode={onRetryZipcode}
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={onShowMap}
              className="flex-1 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-colors"
            >
              Show on Google Map
            </button>
            <button
              onClick={() => onSelectPlace(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        !fetching && <p className="text-xs text-gray-400 text-center mt-3">Tap the button above and allow location access when prompted</p>
      )}
    </div>
  );
}

export default function AddOutletModal({ onClose, onCreated }) {
  const { brand, loading: brandLoading } = useBrand();
  const {
    form,
    update,
    updateWhatsapp,
    setSubBrandId,
    setBrandId,
    setLocation,
    persistLocation,
    retryLocationWithZipcode,
    savedLocations,
    loadingSavedLocations,
    loadSavedLocations,
    selectSavedLocation,
    submit,
    submitting,
    error,
    clearError,
    successMessage,
    clearSuccessMessage,
  } = useAddOutletForm((created) => {
    onCreated?.(created);
    onClose();
  });

  const brandId = brand?._id;

  useEffect(() => {
    if (brandId) {
      setBrandId(brandId);
      loadSavedLocations({ brandId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // ── Edge case: a location was picked before subBrandId existed (e.g.
  // merchant somehow selected a place before finishing WhatsApp verify).
  // persistLocation() no-ops without a subBrandId, so once one shows up,
  // retry saving whatever pick is still sitting unsaved.
  useEffect(() => {
    if (form.subBrandId && form.location && !form.locationSaved && !form.locationSaving) {
      persistLocation(form.location, form.subBrandId, form.brandId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subBrandId]);

  // ── Outlet WhatsApp Number — same OTP-verify flow as CreateBrandOutlet ──
  const brandWhatsappNumber = brand?.whatsappNumber || brand?.phone || brand?.mobile || "";
  const [otpStage, setOtpStage] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpConfirming, setOtpConfirming] = useState(false);
  const [otpError, setOtpError] = useState("");

  // ── Keep the copied-in number synced once brand data actually arrives ──
  useEffect(() => {
    if (form.whatsapp.isBrandNumber && brandWhatsappNumber && form.whatsapp.number !== brandWhatsappNumber) {
      updateWhatsapp({ number: brandWhatsappNumber });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandWhatsappNumber, form.whatsapp.isBrandNumber]);

  const handleUseBrandNumberToggle = (checked) => {
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
    updateWhatsapp({
      isBrandNumber: checked,
      number: checked ? brandWhatsappNumber : "",
      verified: false,
    });
    setSubBrandId(null);
  };

  const handleOutletWhatsappChange = (value) => {
    updateWhatsapp({ number: value, verified: false });
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
    setSubBrandId(null);
  };

  // ── Real API: create the subBrand shell + trigger the WhatsApp OTP ──
  const sendWhatsappOtp = async () => {
    if (!isValidPhone(form.whatsapp.number) || !brandId) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await sendOutletWhatsappOtp({
        brandId,
        whatsappNumber: form.whatsapp.number,
        isFirstOutlet: false,
      });
      const subBrandId = res?.data?.subBrandId ?? res?.subBrandId ?? null;
      if (!subBrandId) {
        throw new Error("Couldn't create the outlet record. Please try again.");
      }
      setSubBrandId(subBrandId);
      setOtpStage(true);
    } catch (err) {
      setOtpError(err?.message || "Couldn't send OTP. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // ── Real API: resend OTP only — must NOT re-run sendOutletWhatsappOtp,
  // that would recreate the subBrand shell every time. Resend just
  // re-triggers the OTP message.
  const resendWhatsappOtp = async () => {
    if (!isValidPhone(form.whatsapp.number)) return;
    setOtpSending(true);
    setOtpError("");
    try {
      await loginOrSignUpWithWhatsapp({ whatsappNumber: form.whatsapp.number });
    } catch (err) {
      setOtpError(err?.message || "Couldn't resend OTP. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // ── Real API: verify the OTP the merchant received on WhatsApp ──
  const confirmWhatsappOtp = async () => {
    if (otpValue.length < 4) return;
    setOtpConfirming(true);
    setOtpError("");
    try {
      await verifyOtpWhatsapp({
        whatsappNumber: form.whatsapp.number,
        otp: otpValue,
      });
      updateWhatsapp({ verified: true });
      setOtpStage(false);
      setOtpValue("");
    } catch (err) {
      setOtpError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpConfirming(false);
    }
  };

  const closeOtpModal = () => {
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
  };

  // The main "Verify" button only creates the subBrand shell + sends the
  // FIRST OTP. Once form.subBrandId exists, the shell already exists for
  // this number — clicking the button again must resend (same OTP flow,
  // no re-creation) instead of calling sendOutletWhatsappOtp a second time,
  // which would otherwise create a duplicate subBrand record.
  const handleVerifyOrResendClick = () => {
    if (form.subBrandId) {
      resendWhatsappOtp();
      setOtpStage(true);
    } else {
      sendWhatsappOtp();
    }
  };

  // ── Outlet Location — search vs live, same as CreateBrandOutlet ──
  const [showMap, setShowMap] = useState(false);

  // Tracked separately from form.locationId — selecting a saved location
  // creates a BRAND NEW location doc for this outlet (a fresh id), so it
  // can never be compared against the original saved doc's _id.
  const [selectedSavedLocationId, setSelectedSavedLocationId] = useState(null);

  const handleSelectSavedLocation = (loc) => {
    setSelectedSavedLocationId(loc._id);
    selectSavedLocation(loc);
  };

  const handleSelectPlace = (place) => {
    setSelectedSavedLocationId(null);
    setLocation(place);
  };

  const switchLocationMode = useCallback(
    (mode) => {
      update("locationMode", mode);
      setLocation(null);
      setSelectedSavedLocationId(null);
    },
    [update, setLocation]
  );

  // Retries the currently-picked place with a merchant-typed pincode — the
  // recovery path for the "missing zipcode" error a fresh Google result can
  // sometimes produce.
  const handleRetryZipcode = (zipcode) => retryLocationWithZipcode(zipcode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="flex-1 text-base font-bold text-gray-900">Add Outlet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Outlet Type (Outlet vs Franchise) ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Type *</label>
            <div className="relative">
              <select
                value={form.outletType}
                onChange={(e) => update("outletType", e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                <option value="">eg : Outlet</option>
                {OUTLET_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="eg : Main city outlet of the brand"
              rows={2}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* ── Active ── */}
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            Active
          </label>

          {/* ── Outlet WhatsApp Number ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet WhatsApp Number *</label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.whatsapp.isBrandNumber}
                onChange={(e) => handleUseBrandNumberToggle(e.target.checked)}
                disabled={brandLoading || !brandWhatsappNumber}
                className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:opacity-40"
              />
              Use my Brand's WhatsApp number
              {brandLoading
                ? " (loading…)"
                : brandWhatsappNumber
                ? ` (${brandWhatsappNumber})`
                : " (not available on your brand profile)"}
            </label>

            <div className="flex gap-2">
              <input
                type="tel"
                value={form.whatsapp.number}
                onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                disabled={form.whatsapp.isBrandNumber}
                placeholder="eg : 9876543210"
                className={`${inputBase} disabled:bg-gray-100 disabled:text-gray-500`}
              />
              {!form.whatsapp.verified && (
                <button
                  type="button"
                  onClick={handleVerifyOrResendClick}
                  disabled={!isValidPhone(form.whatsapp.number) || otpSending || !brandId}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isValidPhone(form.whatsapp.number) && !otpSending && brandId
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {otpSending ? "Sending…" : form.subBrandId ? "Resend" : "Verify"}
                </button>
              )}
            </div>

            {form.whatsapp.isBrandNumber && !form.whatsapp.verified && (
              <p className="text-xs text-amber-600 mt-2">
                This number is pulled from your brand profile, but still needs to be verified for this outlet.
              </p>
            )}

            {form.whatsapp.verified && (
              <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Number verified
              </p>
            )}

            {!form.whatsapp.verified && (
              <p className="text-xs text-gray-400 mt-2">Verify your WhatsApp number to enable Save Outlet.</p>
            )}

            {otpError && !otpStage && <p className="text-xs text-rose-500 mt-2">{otpError}</p>}
          </div>

          {/* ── Outlet Location ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Location *</label>

            {/* Saved locations — reuse an address that's already been
                validated once (real zipcode/district/coordinates), so
                picking one can never hit "missing zipcode". */}
            {(loadingSavedLocations || savedLocations.length > 0) && (
              <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Or Pick A Saved Location
                </p>
                {loadingSavedLocations ? (
                  <p className="text-xs text-gray-400">Loading saved locations…</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {savedLocations.map((loc) => {
                      const isSelected = selectedSavedLocationId === loc._id;
                      return (
                        <button
                          key={loc._id}
                          type="button"
                          onClick={() => handleSelectSavedLocation(loc)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors border ${
                            isSelected
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-transparent bg-gray-50/60 text-gray-600 hover:border-emerald-100 hover:bg-emerald-50/40"
                          }`}
                        >
                          <span className="block font-semibold truncate">
                            {loc.addressLine1 || loc.formattedAddress || "Saved address"}
                          </span>
                          <span className="block text-[11px] text-gray-400 truncate mt-0.5">
                            {[loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.locationMode === "search"}
                  onChange={() => switchLocationMode("search")}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                Search My Outlet Location
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.locationMode === "live"}
                  onChange={() => switchLocationMode("live")}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                Use My Live Location
              </label>
            </div>

            {!form.subBrandId && (
              <p className="text-xs text-amber-600 mb-2">Verify your WhatsApp number first — location saves against that outlet record.</p>
            )}

            {form.locationMode === "search" ? (
              <OutletLocationSearch
                selectedPlace={form.location}
                onSelectPlace={handleSelectPlace}
                onShowMap={() => setShowMap(true)}
                locationSaving={form.locationSaving}
                locationSaved={form.locationSaved}
                locationError={form.locationError}
                onRetryZipcode={handleRetryZipcode}
              />
            ) : (
              <LiveLocationPicker
                selectedPlace={form.location}
                onSelectPlace={handleSelectPlace}
                onShowMap={() => setShowMap(true)}
                locationSaving={form.locationSaving}
                locationSaved={form.locationSaved}
                locationError={form.locationError}
                onRetryZipcode={handleRetryZipcode}
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !form.whatsapp.verified}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm tracking-wide shadow-sm shadow-emerald-100 hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : (
              "Save Outlet"
            )}
          </button>
        </div>
      </div>

      {otpStage && !form.whatsapp.verified && (
        <OtpVerifyModal
          phone={form.whatsapp.number}
          otpValue={otpValue}
          onOtpChange={setOtpValue}
          otpError={otpError}
          onConfirm={confirmWhatsappOtp}
          onClose={closeOtpModal}
          onResend={resendWhatsappOtp}
          resending={otpSending}
          confirming={otpConfirming}
        />
      )}

      {showMap && form.location && (
        <MapModal
          lat={form.location.lat}
          lng={form.location.lng}
          label={form.location.name}
          onClose={() => setShowMap(false)}
        />
      )}

      <ErrorToast
        error={error || otpError ? { message: error || otpError } : null}
        onDismiss={() => {
          clearError();
          setOtpError("");
        }}
      />
      <SuccessToast message={successMessage} onDismiss={clearSuccessMessage} />
    </div>
  );
}