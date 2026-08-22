import React, { useState } from "react";
import { Play, X, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";

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
      <video src={src} controls autoPlay className="w-full rounded-2xl">
        Your browser doesn't support video playback.
      </video>
      {title && (
        <p className="mt-2 text-center text-xs text-gray-300">{title}</p>
      )}
    </div>
  </div>
);

/**
 * ShowcaseMediaRow
 * Renders a row of media thumbnails for a section.
 * - PHOTO: plain thumbnail
 * - VIDEO: thumbnail with a play button overlay -> opens a modal player
 * Hovering a thumbnail reveals a small toolbar: move up/down within this
 * row (onMoveUp/onMoveDown), replace the underlying file (onReplace), and
 * delete (onDelete) — each optional, so a caller can omit any action.
 */
const ShowcaseMediaRow = ({ medias, type, onDelete, onReplace, onMoveUp, onMoveDown }) => {
  const [playing, setPlaying] = useState(null);

  const safeMedias = Array.isArray(medias) ? medias : [];
  if (safeMedias.length === 0) return null;

  const handleReplaceFile = (mediaId, e) => {
    const file = e.target.files?.[0];
    if (file) onReplace(mediaId, file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-5 py-4">
      {safeMedias.map((media, index) => (
        <div key={media._id} className="group relative h-16 w-16 shrink-0">
          {media.type === "VIDEO" ? (
            <button
              type="button"
              onClick={() => setPlaying(media)}
              className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-100 bg-gray-900"
              aria-label={`Play ${media.title || "video"}`}
            >
              <img
                src={media.thumbnail || media.url}
                alt={media.altText || media.title}
                className="h-full w-full object-cover opacity-70"
              />
              <Play
                size={18}
                className="absolute inset-0 m-auto text-white drop-shadow"
                fill="white"
              />
            </button>
          ) : (
            <img
              src={media.thumbnail || media.url}
              alt={media.altText || media.title}
              className="h-16 w-16 rounded-xl border border-gray-100 object-cover"
            />
          )}

          <div className="absolute inset-x-0 bottom-0 hidden items-center justify-center gap-1.5 rounded-b-xl bg-black/60 py-0.5 group-hover:flex">
            {onMoveUp && (
              <button
                type="button"
                onClick={() => onMoveUp(media._id)}
                disabled={index === 0}
                aria-label="Move earlier"
                className="text-white hover:text-emerald-300 disabled:opacity-30 disabled:hover:text-white"
              >
                <ChevronUp size={11} />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={() => onMoveDown(media._id)}
                disabled={index === safeMedias.length - 1}
                aria-label="Move later"
                className="text-white hover:text-emerald-300 disabled:opacity-30 disabled:hover:text-white"
              >
                <ChevronDown size={11} />
              </button>
            )}
            {onReplace && (
              <label aria-label="Replace media" className="cursor-pointer text-white hover:text-emerald-300">
                <Upload size={11} />
                <input
                  type="file"
                  accept={type === "video" ? "video/*" : "image/*"}
                  className="hidden"
                  onChange={(e) => handleReplaceFile(media._id, e)}
                />
              </label>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(media._id)}
                aria-label="Delete media"
                className="text-white hover:text-rose-300"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      ))}

      {playing && (
        <VideoModal
          src={playing.url}
          title={playing.title}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
};

export default ShowcaseMediaRow;