import React, { useState } from "react";
import { Play, X, Trash2 } from "lucide-react";

const VideoModal = ({ src, title, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-lg rounded-lg bg-black"
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
      <video src={src} controls autoPlay className="w-full rounded-lg">
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
 * Each thumbnail has a small delete (x) button on hover, calling onDelete(mediaId).
 */
const ShowcaseMediaRow = ({ medias, type, onDelete }) => {
  const [playing, setPlaying] = useState(null);

  const safeMedias = Array.isArray(medias) ? medias : [];
  if (safeMedias.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-5 py-4">
      {safeMedias.map((media) => (
        <div key={media._id} className="group relative h-14 w-14 shrink-0">
          {media.type === "VIDEO" ? (
            <button
              type="button"
              onClick={() => setPlaying(media)}
              className="relative h-14 w-14 overflow-hidden rounded-md bg-gray-900"
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
              className="h-14 w-14 rounded-md object-cover"
            />
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(media._id)}
              aria-label="Delete media"
              className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white group-hover:flex"
            >
              <Trash2 size={11} />
            </button>
          )}
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