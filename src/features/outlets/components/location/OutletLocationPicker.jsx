// Shared outlet-location UI — used by both Add Outlet and Edit Outlet so
// the two stay identical: Search / Live tabs, the saved-locations list, the
// Google Places search, live (GPS) detection, and the picked-location card.
// Saving is up to the caller (Add saves on pick / "Create Location"; Edit
// stages the change and saves on "Save Changes").
import { useState, useEffect } from "react";

const inputBase =
  "w-full rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-100 bg-emerald-50 dark:bg-emerald-500/10 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100";

// ─── Google Maps ────────────────────────────────────────────────────────────
// Same env key CreateBrandOutlet's googleMapsService uses (an old hardcoded
// key belonged to a Google project with billing disabled, so every Places
// search failed with BillingNotEnabledMapError).
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

const LOCATION_MODES = [
  {
    value: "search",
    label: "Search Location",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
    ),
  },
  {
    value: "live",
    label: "Live Location",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
];

// ─── Map Preview Modal ─────────────────────────────────────────────────────────
export function MapModal({ lat, lng, label, onClose }) {
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{label || "Map Preview"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lat: {lat} · Lng: {lng}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="px-5 py-3 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors">
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}

// Shows a location save ERROR under a picked place (saving/saved now live
// in SelectedLocationCard's status chip), plus — when the error is
// specifically a missing zipcode — an inline pincode input so the merchant
// can fix it in place instead of hitting a dead end and having to search
// again.
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

  if (locationSaving || locationSaved || !locationError) return null;

  return (
    <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5">
      <p className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300">
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
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying || manualZipcode.trim().length < 4}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              retrying || manualZipcode.trim().length < 4
                ? "bg-gray-100 dark:bg-gray-700 text-gray-300 cursor-not-allowed"
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

const LOCATION_STATUS_CHIPS = {
  saving: { label: "Saving…", className: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300" },
  saved: { label: "Saved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  error: { label: "Not saved", className: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300" },
  waiting: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  unsaved: { label: "Not saved yet", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
};

// ─── Picked-location card — shared by the Search and Live pickers ──────────
// Label + status chip, the address, any save error (with the pincode fix),
// then one action row: Create Location (when unsaved) + Map + Clear.
export function SelectedLocationCard({
  label,
  place,
  locationSaving,
  locationSaved,
  locationError,
  waitingNote,
  statusOverride,
  onRetryZipcode,
  createLocationButton,
  onShowMap,
  onClear,
}) {
  const status = locationSaving
    ? "saving"
    : locationSaved
      ? "saved"
      : locationError
        ? "error"
        : waitingNote
          ? "waiting"
          : "unsaved";
  const chip = statusOverride || LOCATION_STATUS_CHIPS[status];
  const showName = place.name && place.name !== "Current Location" && !place.address?.startsWith(place.name);

  return (
    <div className="mt-4 animate-fade-in rounded-2xl bg-gray-50 dark:bg-gray-700/40 p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            locationSaved
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400"
          }`}
        >
          {locationSaved ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${chip.className}`}>
              {status === "saving" && (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {chip.label}
            </span>
          </div>
          {showName && <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">{place.name}</p>}
          <p className={`text-sm leading-relaxed text-gray-700 dark:text-gray-200 ${showName ? "mt-0.5" : "mt-1"}`}>{place.address}</p>
        </div>
      </div>

      <LocationSaveStatus
        locationSaving={locationSaving}
        locationSaved={locationSaved}
        locationError={locationError}
        onRetryZipcode={onRetryZipcode}
      />

      {waitingNote && !locationSaved && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{waitingNote}</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {createLocationButton}
        <button
          type="button"
          onClick={onShowMap}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-white hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400 ${
            createLocationButton ? "" : "flex-1 bg-white dark:bg-gray-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {createLocationButton ? "Map" : "View on Map"}
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Clear location"
          className="flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-gray-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  );
}

// ─── Outlet Location Search (Google Places Text Search + Place Details) ───────
export function OutletLocationSearch({ selectedPlace, onSelectPlace, onShowMap, locationSaving, locationSaved, locationError, onRetryZipcode, createLocationButton, waitingNote, statusOverride }) {
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
    } catch {
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
    } catch {
      setError("Couldn't fetch details for that place. Try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Find Your Outlet Location Using Google Maps.</p>
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
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-500 mb-3">{error}</p>}

      {results.length > 0 && (
        <div className="no-scrollbar mb-4 max-h-64 overflow-y-auto rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
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
                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{place.name}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{place.formatted_address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {detailsLoading && <p className="text-xs text-gray-400 mb-4">Fetching place details…</p>}

      {hasSearched && !searching && results.length === 0 && !error && (
        <p className="text-xs text-gray-400 mb-4">No matches found. Try a different search term.</p>
      )}

      {/* Location save is its OWN API call (fired when the place is picked,
          or via Create Location), independent of the final Save Outlet. */}
      {selectedPlace ? (
        <SelectedLocationCard
          label={
            selectedPlace.source === "saved"
              ? "Saved Location"
              : selectedPlace.source === "existing"
                ? "Current Location"
                : "Selected Location"
          }
          place={selectedPlace}
          locationSaving={locationSaving}
          locationSaved={locationSaved}
          locationError={locationError}
          waitingNote={waitingNote}
          statusOverride={statusOverride}
          onRetryZipcode={onRetryZipcode}
          createLocationButton={createLocationButton}
          onShowMap={onShowMap}
          onClear={() => onSelectPlace(null)}
        />
      ) : (
        !results.length && <p className="text-xs text-gray-400 text-center">Search above and pick your outlet to pin its location.</p>
      )}
    </div>
  );
}

// ─── Live Location Picker (Geolocation + Reverse Geocoding) ───────────────────
export function LiveLocationPicker({ selectedPlace, onSelectPlace, onShowMap, locationSaving, locationSaved, locationError, onRetryZipcode, createLocationButton, waitingNote, statusOverride }) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const hasDetected = selectedPlace?.source === "live";

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
        } catch {
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
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Use Your Live Location</p>
          <p className="text-xs text-gray-400 mt-0.5">Allow location access from your browser and we'll auto-detect your outlet's address.</p>
        </div>
      </div>

      {/* Primary until an address is detected; then a quieter "Detect
          again" so the card's own actions lead. */}
      <button
        onClick={useMyLocation}
        disabled={fetching}
        className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed ${
          fetching
            ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
            : hasDetected
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
        }`}
      >
        {fetching ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            <circle cx="12" cy="12" r="7" />
          </svg>
        )}
        {fetching ? "Detecting your location…" : hasDetected ? "Detect again" : "Use My Current Location"}
      </button>

      {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

      {hasDetected ? (
        <SelectedLocationCard
          label="Detected Address"
          place={selectedPlace}
          locationSaving={locationSaving}
          locationSaved={locationSaved}
          locationError={locationError}
          waitingNote={waitingNote}
          statusOverride={statusOverride}
          onRetryZipcode={onRetryZipcode}
          createLocationButton={createLocationButton}
          onShowMap={onShowMap}
          onClear={() => onSelectPlace(null)}
        />
      ) : (
        !fetching && <p className="text-xs text-gray-400 text-center mt-3">Allow location access when your browser asks.</p>
      )}
    </div>
  );
}

// ─── Search vs Live — segmented tabs ───────────────────────────────────────
export function LocationModeTabs({ mode, onChange }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700/60" role="tablist">
      {LOCATION_MODES.map(({ value, label, icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && onChange(value)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 ${
              active
                ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-800 dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Saved locations — reuse an address that's already been validated once
// (real zipcode/district/coordinates), so picking one can never hit
// "missing zipcode". Renders nothing when there are none. ───────────────────
export function SavedLocationsList({ locations, loading, selectedId, onSelect }) {
  if (!loading && !locations.length) return null;
  return (
    <div className="mb-3 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Or Pick A Saved Location</p>
      {loading ? (
        <p className="text-xs text-gray-400">Loading saved locations…</p>
      ) : (
        <div className="no-scrollbar max-h-32 overflow-y-auto space-y-1.5">
          {locations.map((loc) => {
            const isSelected = selectedId === loc._id;
            return (
              <button
                key={loc._id}
                type="button"
                onClick={() => onSelect(loc)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-gray-50/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10"
                }`}
              >
                <span className="block font-semibold truncate">{loc.addressLine1 || loc.formattedAddress || "Saved address"}</span>
                <span className="block text-[11px] text-gray-400 truncate mt-0.5">
                  {[loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ")}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
