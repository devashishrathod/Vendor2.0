import React, { useState, useRef } from "react";
import { RefreshCcw, Trash2, Play, X, ListChecks } from "lucide-react";

// Detects video vs image by file extension in the URL.
const isVideoUrl = (url = "") => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);

const MediaThumb = ({ src, alt, onPlay }) => {
  const video = isVideoUrl(src);

  if (!video) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-10 w-10 rounded-xl border border-gray-100 object-contain"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-900"
      aria-label={`Play ${alt}`}
    >
      <video src={src} className="h-full w-full object-cover opacity-70" muted />
      <Play
        size={16}
        className="absolute text-white drop-shadow group-hover:scale-110 transition-transform"
        fill="white"
      />
    </button>
  );
};

const VideoModal = ({ src, title, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-lg rounded-2xl bg-black"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-10 right-0 text-white hover:text-gray-300"
      >
        <X size={22} />
      </button>
      <video
        src={src}
        controls
        autoPlay
        className="w-full rounded-2xl"
      >
        Your browser doesn't support video playback.
      </video>
      <p className="mt-2 text-center text-xs text-gray-300">{title}</p>
    </div>
  </div>
);

const ListingFeaturesSection = ({
  listingFeatures,
  onAdd,
  onRefresh,
  onDelete,
}) => {
  const [playingFeature, setPlayingFeature] = useState(null);

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <ListChecks size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Listing Features
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {listingFeatures.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] px-5 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200"
        >
          Add
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">S.NO</th>
              <th className="px-5 py-3">Icon / Video</th>
              <th className="px-5 py-3">LF Name</th>
              <th className="px-5 py-3">CreateOn</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listingFeatures.features.map((feature) => (
              <tr
                key={feature.id}
                className="border-b border-gray-50 last:border-b-0"
              >
                <td className="px-5 py-4 text-gray-800">{feature.sNo}</td>
                <td className="px-5 py-4">
                  <MediaThumb
                    src={feature.iconUrl}
                    alt={feature.lfName}
                    onPlay={() => setPlayingFeature(feature)}
                  />
                </td>
                <td className="px-5 py-4 text-gray-800">{feature.lfName}</td>
                <td className="px-5 py-4 text-gray-500">
                  {feature.createdOn}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onRefresh(feature.id)}
                      aria-label="Refresh"
                      className="text-emerald-500 hover:text-emerald-600"
                    >
                      <RefreshCcw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(feature.id)}
                      aria-label="Delete"
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {playingFeature && (
        <VideoModal
          src={playingFeature.iconUrl}
          title={playingFeature.lfName}
          onClose={() => setPlayingFeature(null)}
        />
      )}
    </section>
  );
};

export default ListingFeaturesSection;