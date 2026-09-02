import { useState, useRef, useEffect } from "react";
import { Play, X, Trash2, Upload, MoreVertical, Eye } from "lucide-react";

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

const ImageModal = ({ src, title, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div className="relative max-w-2xl" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-10 right-0 text-white hover:text-gray-300"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={title || "Preview"}
        className="max-h-[80vh] w-full rounded-2xl bg-black object-contain"
      />
      {title && (
        <p className="mt-2 text-center text-xs text-gray-300">{title}</p>
      )}
    </div>
  </div>
);

// Small "⋮" menu — only ever holds Replace, so a dropdown instead of a
// permanently-visible icon keeps that (less-frequent) action out of the
// card's primary eye/delete row.
function MediaMenu({ type, onReplace }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm hover:bg-white"
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 w-32 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            <Upload size={12} /> Replace
            <input
              type="file"
              accept={type === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={(e) => {
                onReplace(e);
                setOpen(false);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/**
 * ShowcaseMediaRow
 * Grid of media cards for one type (photos or videos) within a section.
 * The numbered badge is this row's own 1-based position (purely a visual
 * "this is photo #3" cue) — NOT the section's combined sortOrder used by
 * the reorder API; that combined view lives in ShowcaseGroup's Order panel,
 * since sortOrder is one shared sequence across photos+videos together.
 */
const ShowcaseMediaRow = ({ medias, type, onDelete, onReplace }) => {
  const [playing, setPlaying] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const safeMedias = Array.isArray(medias) ? medias : [];
  if (safeMedias.length === 0) return null;

  const handleReplaceFile = (mediaId, e) => {
    const file = e.target.files?.[0];
    if (file) onReplace(mediaId, file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {safeMedias.map((media, index) => {
        const title = media.title || (type === "video" ? `Video ${index + 1}` : `Photo ${index + 1}`);
        return (
          <div
            key={media._id}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="relative aspect-square bg-gray-100">
              <span className="absolute left-2 top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900/80 px-1.5 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              {onReplace && (
                <div className="absolute right-2 top-2 z-10">
                  <MediaMenu type={type} onReplace={(e) => handleReplaceFile(media._id, e)} />
                </div>
              )}

              {media.type === "VIDEO" ? (
                <button
                  type="button"
                  onClick={() => setPlaying(media)}
                  className="block h-full w-full"
                  aria-label={`Play ${title}`}
                >
                  {/* The actual video, not a separate thumbnail image — the
                      browser renders its first frame natively, so this
                      always matches the real clip instead of a possibly
                      stale/missing thumbnail field. */}
                  <video
                    src={media.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <Play size={28} className="absolute inset-0 m-auto text-white drop-shadow" fill="white" />
                </button>
              ) : (
                <img
                  src={media.thumbnail || media.url}
                  alt={media.altText || title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-medium text-gray-700">{title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (media.type === "VIDEO" ? setPlaying(media) : setPreviewing(media))}
                  aria-label="Preview"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-emerald-500"
                >
                  <Eye size={13} />
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(media._id)}
                    aria-label="Delete media"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {playing && (
        <VideoModal src={playing.url} title={playing.title} onClose={() => setPlaying(null)} />
      )}
      {previewing && (
        <ImageModal src={previewing.url} title={previewing.title} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
};

export default ShowcaseMediaRow;
