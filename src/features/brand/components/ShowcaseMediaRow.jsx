import { useState, useRef, useEffect } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Play, X, Trash2, Upload, MoreVertical } from "lucide-react";
import { mergeRefs, noDragRef } from "../utils/BrandHelpers";

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

// Single "⋮" menu holding every secondary action (Replace, Delete) — the
// tile itself has just this one icon plus the position badge; viewing the
// media is the tile's own default click, not a separate button.
function MediaMenu({ type, onReplace, onDelete }) {
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
          {onReplace && (
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
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// One draggable card within the grid — the WHOLE card is the drag handle
// (grab anywhere and move, no small icon to aim for) AND the click target
// for viewing the media (Play for video, preview modal for a photo).
// Replace/Delete live in the single "⋮" menu instead of their own always-
// visible icons, so a tile is just: photo/video + position badge + menu.
// The menu wrapper uses noDragRef so opening it never gets swallowed into a
// drag attempt (see noDragRef's comment for why).
function MediaTile({ media, index, onDelete, onReplace, onPlay, onPreview }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  const mediaType = media.type === "VIDEO" ? "video" : "image";

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onReplace(media._id, file);
    e.target.value = "";
  };

  return (
    <div
      ref={mergeRefs(ref, handleRef)}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl border border-gray-100 bg-gray-100 transition-opacity active:cursor-grabbing"
    >
      <span className="absolute left-1.5 top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900/80 px-1 text-[9px] font-bold text-white">
        {index + 1}
      </span>
      {(onReplace || onDelete) && (
        <div className="absolute right-1.5 top-1.5 z-10" ref={noDragRef}>
          <MediaMenu
            type={mediaType}
            onReplace={onReplace ? handleReplaceFile : undefined}
            onDelete={onDelete ? () => onDelete(media._id) : undefined}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => (media.type === "VIDEO" ? onPlay(media) : onPreview(media))}
        className="block h-full w-full"
        aria-label={media.type === "VIDEO" ? "Play video" : "Preview photo"}
      >
        {media.type === "VIDEO" ? (
          <>
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
            <Play size={22} className="absolute inset-0 m-auto text-white drop-shadow" fill="white" />
          </>
        ) : (
          <img
            src={media.thumbnail || media.url}
            alt={media.altText || `Photo ${index + 1}`}
            className="h-full w-full object-cover"
          />
        )}
      </button>
    </div>
  );
}

/**
 * ShowcaseMediaRow
 * Single combined grid of media cards (photos AND videos together, in one
 * row) for a section. Each card is directly draggable anywhere on it —
 * dropping calls `onReorder(mediaId, newPosition)` with the dragged item's
 * new 1-based position in this same combined list, matching the section's
 * single shared sortOrder sequence.
 */
const ShowcaseMediaRow = ({ medias, onDelete, onReplace, onReorder }) => {
  const [playing, setPlaying] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const safeMedias = Array.isArray(medias) ? medias : [];
  if (safeMedias.length === 0) return null;

  const handleDragEnd = (event) => {
    if (event.canceled || !onReorder) return;
    const draggedId = event.operation.source?.id;
    if (draggedId == null) return;
    const idItems = safeMedias.map((m) => ({ id: m._id }));
    const moved = move(idItems, event);
    const newIndex = moved.findIndex((item) => item.id === draggedId);
    if (newIndex === -1) return;
    onReorder(draggedId, newIndex + 1);
  };

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {safeMedias.map((media, index) => (
          <MediaTile
            key={media._id}
            media={media}
            index={index}
            onDelete={onDelete}
            onReplace={onReplace}
            onPlay={setPlaying}
            onPreview={setPreviewing}
          />
        ))}
      </div>

      {/* No `title` passed — media.title is just the raw uploaded filename
          (e.g. "images (3)"), not a real caption, so the modal shows the
          media itself with no caption line instead of that raw name. */}
      {playing && (
        <VideoModal src={playing.url} onClose={() => setPlaying(null)} />
      )}
      {previewing && (
        <ImageModal src={previewing.url} onClose={() => setPreviewing(null)} />
      )}
    </DragDropProvider>
  );
};

export default ShowcaseMediaRow;
