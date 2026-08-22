import { useState } from "react";
import { reverseGeocode } from "../../services/googleMapsService";

export default function LiveLocationPicker({ selectedPlace, onSelectPlace, onShowMap }) {
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
