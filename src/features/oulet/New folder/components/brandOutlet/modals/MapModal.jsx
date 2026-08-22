import { useMemo, useState } from "react";
import {
  Navigation,
  Bookmark,
  Phone,
  Globe,
  Share2,
  Star,
} from "lucide-react";

const TABS = ["Overview", "Photos", "Hours"];

export default function MapModal({ place, onClose }) {
  const {
    name,
    address,
    lat,
    lng,
    placeId,

    photos = [],
    rating,
    userRatingsTotal,

    openingHours,
    phone,
    website,

    googleMapsUrl,
    businessStatus,
  } = place || {};

  const hasCoordinates =
    typeof lat === "number" && typeof lng === "number";

  const mapSrc = useMemo(() => {
    if (!hasCoordinates) return "";
    return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }, [lat, lng, hasCoordinates]);

  // ─────────────────────────────────────────────
  // PHOTOS — resolve every photo up front, once.
  // This array never changes when switching tabs,
  // so nothing gets reset when the user clicks around.
  // ─────────────────────────────────────────────
  const photoUrls = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    return photos
      .map((p) =>
        typeof p?.getUrl === "function"
          ? p.getUrl({ maxWidth: 1200, maxHeight: 800 })
          : p?.url || null
      )
      .filter(Boolean);
  }, [photos]);

  const [activePhoto, setActivePhoto] = useState(0);
  const currentPhoto = photoUrls[activePhoto] || null;

  const goToPhoto = (idx) => {
    if (photoUrls.length === 0) return;
    setActivePhoto((idx + photoUrls.length) % photoUrls.length);
  };

  // ─────────────────────────────────────────────
  // TABS — purely a display toggle. The underlying
  // `place` data is never re-fetched or cleared here,
  // so switching tabs keeps everything intact.
  // ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Overview");

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  const mapsUrl =
    googleMapsUrl ||
    (placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : hasCoordinates
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "");

  const [saved, setSaved] = useState(false);
  const [showFullFacts, setShowFullFacts] = useState(false);

  const handleDirections = () => {
    if (!mapsUrl) return;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const handleCall = () => {
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  };

  const handleWebsite = () => {
    if (!website) return;
    window.open(website, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const shareData = {
      title: name || "Place",
      text: address || "",
      url: mapsUrl || website || "",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && shareData.url) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      // user cancelled share — ignore
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "OPERATIONAL":
        return { text: "Open", color: "text-emerald-600" };
      case "CLOSED_TEMPORARILY":
        return { text: "Temporarily closed", color: "text-amber-600" };
      case "CLOSED_PERMANENTLY":
        return { text: "Permanently closed", color: "text-rose-600" };
      default:
        return null;
    }
  };
  const status = statusLabel(businessStatus);

  const facts = openingHours?.weekday_text?.length
    ? `Open ${openingHours.weekday_text.length} days a week. ${openingHours.weekday_text[0]}`
    : address
    ? `Located at ${address}.`
    : "No additional details available.";

  // ─────────────────────────────────────────────
  // ICON ACTION BUTTON
  // ─────────────────────────────────────────────
  const ActionButton = ({ icon: Icon, label, onClick, primary, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
          primary
            ? "bg-teal-700 text-white hover:bg-teal-800"
            : "bg-sky-50 text-sky-900 hover:bg-sky-100"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="text-xs text-gray-700 text-center leading-tight">
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="relative w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─────────────────────────────────────── */}
      {/* BACKGROUND MAP — fills the entire modal */}
      {/* ─────────────────────────────────────── */}
      {hasCoordinates ? (
        <iframe
          title="Outlet Location"
          src={mapSrc}
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-sm text-gray-500">
          Location coordinates unavailable.
        </div>
      )}

      {/* Global close button, sits above the map, top-right of the whole modal */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg text-gray-700 flex items-center justify-center hover:bg-gray-50"
      >
        ✕
      </button>

      {/* ─────────────────────────────────────── */}
      {/* FLOATING CARD — overlays the map, top-left */}
      {/* ─────────────────────────────────────── */}
      <div className="absolute top-4 left-4 bottom-4 z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-y-auto">
        {/* Photo */}
        <div className="relative">
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt={name || "Place"}
              className="w-full h-44 object-cover rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-44 bg-gray-100 flex items-center justify-center rounded-t-2xl">
              <span className="text-gray-400 text-sm">
                No photo available
              </span>
            </div>
          )}

          {photoUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goToPhoto(activePhoto - 1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goToPhoto(activePhoto + 1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white"
              >
                ›
              </button>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                {activePhoto + 1} / {photoUrls.length}
              </div>
            </>
          )}
        </div>

        {/* Title row */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">
              {name || "Place"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {address || "Address unavailable"}
            </p>
          </div>

          {(rating !== null && rating !== undefined) || status ? (
            <div className="text-right shrink-0">
              {rating !== null && rating !== undefined && (
                <div className="flex items-center justify-end gap-1 text-gray-800 font-medium">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {rating}
                </div>
              )}
              {userRatingsTotal !== null && userRatingsTotal !== undefined && (
                <p className="text-xs text-gray-500">
                  {userRatingsTotal.toLocaleString()} reviews
                </p>
              )}
              {status && (
                <p className={`text-xs font-medium mt-0.5 ${status.color}`}>
                  {status.text}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100" />

        {/* Action icon row */}
        <div className="px-3 py-4 flex items-start">
          <ActionButton
            icon={Navigation}
            label="Directions"
            onClick={handleDirections}
            disabled={!mapsUrl}
            primary
          />
          <ActionButton
            icon={Bookmark}
            label={saved ? "Saved" : "Save"}
            onClick={() => setSaved((s) => !s)}
          />
          <ActionButton
            icon={Phone}
            label="Call"
            onClick={handleCall}
            disabled={!phone}
          />
          <ActionButton
            icon={Globe}
            label="Website"
            onClick={handleWebsite}
            disabled={!website}
          />
          <ActionButton icon={Share2} label="Share" onClick={handleShare} />
        </div>

        <div className="border-t border-gray-100" />

        {/* Tabs — switching tabs is display-only, the place
            data stays exactly as loaded, nothing resets */}
        <div className="flex px-5 pt-3 gap-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium pb-2 border-b-2 transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100" />

        {/* Tab content */}
        <div className="px-5 py-4">
          {activeTab === "Overview" && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Quick facts
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {showFullFacts || facts.length <= 140
                  ? facts
                  : `${facts.slice(0, 140)}… `}
                {facts.length > 140 && (
                  <button
                    type="button"
                    onClick={() => setShowFullFacts((v) => !v)}
                    className="text-indigo-600 font-medium"
                  >
                    {showFullFacts ? "Less" : "More"}
                  </button>
                )}
              </p>

              {placeId && (
                <p className="text-[11px] text-gray-400 break-all mt-4">
                  Place ID: {placeId}
                </p>
              )}
            </div>
          )}

          {activeTab === "Photos" && (
            <div>
              {photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {photoUrls.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => {
                        setActivePhoto(idx);
                        setActiveTab("Overview");
                      }}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`${name || "Place"} photo ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No photos available.</p>
              )}
            </div>
          )}

          {activeTab === "Hours" && (
            <div>
              {openingHours?.weekday_text?.length > 0 ? (
                <div className="space-y-1.5">
                  {openingHours.weekday_text.map((day) => (
                    <p key={day} className="text-sm text-gray-600">
                      {day}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Opening hours unavailable.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}