// import { useAddOutletForm } from "../hooks/useAddOutletForm";
// import { REGISTRATION_TYPES, MOCK_SUB_BRANDS, MOCK_FRANCHISES } from "../constants/outletConstants";

// export default function AddOutletModal({ onClose, onCreated }) {
//   const { form, update, submit, submitting, error } = useAddOutletForm((created) => {
//     onCreated?.(created);
//     onClose();
//   });

//   const isSubBrand = form.registrationType === REGISTRATION_TYPES.SUB_BRAND;
//   const entityOptions = isSubBrand ? MOCK_SUB_BRANDS : MOCK_FRANCHISES;

//   const switchType = (type) => {
//     update("registrationType", type);
//     update("registeredWith", "");
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
//           <h3 className="text-base font-bold text-gray-900">Add Outlet</h3>
//           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
//             <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <div className="px-6 py-5 space-y-5">
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Name *</label>
//             <input
//               type="text"
//               value={form.outletName}
//               onChange={(e) => update("outletName", e.target.value)}
//               placeholder="eg : Andiappan Yoga Academy"
//               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Address *</label>
//             <textarea
//               rows={3}
//               value={form.outletAddress}
//               onChange={(e) => update("outletAddress", e.target.value)}
//               placeholder="Full outlet address"
//               className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700 resize-none"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Register With *</label>
//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 type="button"
//                 onClick={() => switchType(REGISTRATION_TYPES.SUB_BRAND)}
//                 className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
//                   isSubBrand ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 Sub - Brand
//               </button>
//               <button
//                 type="button"
//                 onClick={() => switchType(REGISTRATION_TYPES.FRANCHISE)}
//                 className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
//                   !isSubBrand ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 Franchise
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               {isSubBrand ? "Select Sub-Brand *" : "Select Franchise *"}
//             </label>
//             <div className="relative">
//               <select
//                 value={form.registeredWith}
//                 onChange={(e) => update("registeredWith", e.target.value)}
//                 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
//               >
//                 <option value="">Select an option</option>
//                 {entityOptions.map((opt) => (
//                   <option key={opt.id} value={opt.name}>
//                     {opt.name}
//                   </option>
//                 ))}
//               </select>
//               <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//           </div>

//           {error && <p className="text-xs text-red-500">{error}</p>}
//         </div>

//         <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={submit}
//             disabled={submitting}
//             className="flex-1 bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#2d2d5e] disabled:opacity-70"
//           >
//             {submitting ? "Saving…" : "Save Outlet"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useRef, useEffect, useCallback } from "react";
import { useAddOutletForm } from "../hooks/useAddOutletForm";
import { useBrand } from "../../../hooks/useBrand"; // ← path apne project ke hisaab se adjust karo

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
          <button onClick={onClose} className="px-5 py-2 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d5e] transition-colors">
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp OTP Verify Modal ─────────────────────────────────────────────────
function OtpVerifyModal({ phone, otpValue, onOtpChange, otpError, onConfirm, onClose, onResend, resending }) {
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
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-semibold outline-none focus:border-indigo-400 bg-white text-gray-800"
          />

          {otpError && <p className="text-xs text-red-500 mt-2">{otpError}</p>}

          <button
            onClick={onResend}
            disabled={resending}
            className="text-xs font-semibold text-indigo-600 hover:underline mt-3 disabled:opacity-50 disabled:no-underline"
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
            disabled={otpValue.length < 4}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              otpValue.length >= 4
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Outlet Location Search (Google Places Text Search + Place Details) ───────
function OutletLocationSearch({ selectedPlace, onSelectPlace, onShowMap }) {
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
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-gray-800">Find Your Outlet Location Using Google Maps.</p>
          <p className="text-sm text-gray-500 mt-0.5">Search your outlet name and city, then pick it from the results.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="eg : Toni & Guy Ahmedabad"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
        />
        <button
          onClick={runSearch}
          disabled={searching || !query.trim()}
          className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            searching || !query.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {results.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => pickPlace(place)}
              disabled={detailsLoading}
              className="w-full text-left px-4 py-3 hover:bg-[#f3f6fb] transition-colors flex items-start gap-3 disabled:opacity-60"
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
        <div className="bg-[#f3f6fb] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Selected Outlet Location</p>
          <p className="text-sm font-bold text-gray-900">{selectedPlace.name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{selectedPlace.address}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onShowMap}
              className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
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
function LiveLocationPicker({ selectedPlace, onSelectPlace, onShowMap }) {
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
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-gray-800">Use Your Live Location</p>
          <p className="text-sm text-gray-500 mt-0.5">Allow location access from your browser and we'll auto-detect your outlet's address.</p>
        </div>
      </div>

      <button
        onClick={useMyLocation}
        disabled={fetching}
        className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          fetching
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {fetching ? "Fetching your location…" : "Use My Current Location"}
      </button>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {selectedPlace?.source === "live" ? (
        <div className="bg-[#f3f6fb] rounded-xl p-4 mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Detected Address</p>
          <p className="text-sm text-gray-800">{selectedPlace.address}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onShowMap}
              className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
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
  const { brand } = useBrand();
  const { form, update, updateWhatsapp, setLocation, submit, submitting, error } = useAddOutletForm((created) => {
    onCreated?.(created);
    onClose();
  });

  // ── Outlet WhatsApp Number — same OTP-verify flow as CreateBrandOutlet ──
  const brandWhatsappNumber = brand?.whatsappNumber || brand?.phone || brand?.mobile || "";
  const [otpStage, setOtpStage] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleUseBrandNumberToggle = (checked) => {
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
    // Always require a fresh OTP verification for this outlet, even when the
    // number is copied over from the brand profile — it was verified there,
    // not here.
    updateWhatsapp({
      isBrandNumber: checked,
      number: checked ? brandWhatsappNumber : "",
      verified: false,
    });
  };

  const handleOutletWhatsappChange = (value) => {
    updateWhatsapp({ number: value, verified: false });
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
  };

  const sendWhatsappOtp = () => {
    if (!isValidPhone(form.whatsapp.number)) return;
    setOtpSending(true);
    setOtpError("");
    // TODO: replace with real API call, e.g. await api.post("/otp/send", { number: form.whatsapp.number })
    setTimeout(() => {
      setOtpSending(false);
      setOtpStage(true);
    }, 900);
  };

  const confirmWhatsappOtp = () => {
    if (otpValue.length < 4) return;
    // TODO: replace with real API call, e.g. await api.post("/otp/verify", { number: form.whatsapp.number, otp: otpValue })
    setOtpError("");
    updateWhatsapp({ verified: true });
    setOtpStage(false);
    setOtpValue("");
  };

  const closeOtpModal = () => {
    setOtpStage(false);
    setOtpValue("");
    setOtpError("");
  };

  // ── Outlet Location — search vs live, same as CreateBrandOutlet ──
  const [showMap, setShowMap] = useState(false);

  const switchLocationMode = useCallback(
    (mode) => {
      update("locationMode", mode);
      setLocation(null);
    },
    [update, setLocation]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-bold text-gray-900">Add Outlet</h3>
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
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

          {/* ── Outlet WhatsApp Number ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet WhatsApp Number *</label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.whatsapp.isBrandNumber}
                onChange={(e) => handleUseBrandNumberToggle(e.target.checked)}
                disabled={!brandWhatsappNumber}
                className="w-4 h-4 accent-indigo-600 cursor-pointer disabled:opacity-40"
              />
              Use my Brand's WhatsApp number
              {brandWhatsappNumber ? ` (${brandWhatsappNumber})` : " (not available on your brand profile)"}
            </label>

            <div className="flex gap-2">
              <input
                type="tel"
                value={form.whatsapp.number}
                onChange={(e) => handleOutletWhatsappChange(e.target.value)}
                disabled={form.whatsapp.isBrandNumber}
                placeholder="eg : 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-500"
              />
              {!form.whatsapp.verified && (
                <button
                  type="button"
                  onClick={sendWhatsappOtp}
                  disabled={!isValidPhone(form.whatsapp.number) || otpSending}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isValidPhone(form.whatsapp.number) && !otpSending
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {otpSending ? "Sending…" : "Verify"}
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
          </div>

          {/* ── Outlet Location ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Location *</label>

            <div className="flex flex-wrap items-center gap-6 mb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.locationMode === "search"}
                  onChange={() => switchLocationMode("search")}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                Search My Outlet Location
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.locationMode === "live"}
                  onChange={() => switchLocationMode("live")}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                Use My Live Location
              </label>
            </div>

            {form.locationMode === "search" ? (
              <OutletLocationSearch
                selectedPlace={form.location}
                onSelectPlace={setLocation}
                onShowMap={() => setShowMap(true)}
              />
            ) : (
              <LiveLocationPicker
                selectedPlace={form.location}
                onSelectPlace={setLocation}
                onShowMap={() => setShowMap(true)}
              />
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
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
            className="flex-1 bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#2d2d5e] disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Save Outlet"}
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
          onResend={sendWhatsappOtp}
          resending={otpSending}
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
    </div>
  );
}
