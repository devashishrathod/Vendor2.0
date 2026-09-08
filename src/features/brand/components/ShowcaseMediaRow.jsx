import { useState, useRef, useEffect } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Play, X, Trash2, Upload } from "lucide-react";
import { mergeRefs } from "../utils/BrandHelpers";

// A "click" is detected manually here, from raw pointerdown/pointerup
// coordinates — NOT the browser's native `click` event. Once dnd-kit's
// PointerSensor decides a drag has started on this card (its handle is the
// whole card, since dragging must work from anywhere on it), it captures
// the pointer on <body> and explicitly installs a `click`-preventDefault
// listener, so the native click never reaches our button — no combination
// of activation-constraint options changed that. Tracking pointerdown/up
// ourselves sidesteps it entirely: a release within a few pixels of where
// the press started opens the preview, regardless of anything dnd-kit does
// with the pointer in between.
const CLICK_MOVE_TOLERANCE = 6;

function useClickWithoutDrag(onClickLike) {
  const startRef = useRef(null);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handlePointerUp = (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx <= CLICK_MOVE_TOLERANCE && dy <= CLICK_MOVE_TOLERANCE) onClickLike();
    };
    document.addEventListener("pointerup", handlePointerUp);
    return () => document.removeEventListener("pointerup", handlePointerUp);
  }, [onClickLike]);

  return onPointerDown;
}

// Replace/Delete (+ Show in Video Clips for videos) sit directly in the
// header row now — always visible, no "⋮" click needed to reveal them
// (unlike the compact grid tile, this modal has room to spare).
function ModalActions({ type, onReplace, onDelete, onToggleClip, isShowInVideoClips }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onReplace?.(e);
  };

  return (
    <>
      {type === "video" && onToggleClip && (
        <label
          title={isShowInVideoClips ? "Hide from video clips" : "Show in video clips"}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        >
          <input
            type="checkbox"
            checked={!!isShowInVideoClips}
            onChange={(e) => onToggleClip(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-emerald-600 focus:ring-emerald-400"
          />
          Show in Video Clips
        </label>
      )}
      {onReplace && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={type === "video" ? "video/*" : "image/*"}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            <Upload size={13} /> Replace
          </button>
        </>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50"
        >
          <Trash2 size={13} /> Delete
        </button>
      )}
    </>
  );
}

// Header row (Replace/Delete/Show-in-Video-Clips + Close, top-right),
// video below it.
const VideoModal = ({ src, title, onClose, onReplace, onDelete, onToggleClip, isShowInVideoClips }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5 border-b border-gray-100 p-3">
        <ModalActions
          type="video"
          onReplace={onReplace}
          onDelete={onDelete}
          onToggleClip={onToggleClip}
          isShowInVideoClips={isShowInVideoClips}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-center bg-gray-50 p-5">
        <video src={src} controls autoPlay className="max-h-[50vh] rounded-xl">
          Your browser doesn't support video playback.
        </video>
      </div>
      {title && (
        <p className="px-4 py-3 text-center text-xs text-gray-500">{title}</p>
      )}
    </div>
  </div>
);

// Header row (Replace/Delete + Close, top-right), image below it — same
// actions as above, minus the video-only "Show in Video Clips" checkbox.
const ImageModal = ({ src, title, onClose, onReplace, onDelete }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5 border-b border-gray-100 p-3">
        <ModalActions type="image" onReplace={onReplace} onDelete={onDelete} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-center bg-gray-50 p-5">
        <img
          src={src}
          alt={title || "Preview"}
          className="max-h-[50vh] rounded-xl object-contain"
        />
      </div>
      {title && (
        <p className="px-4 py-3 text-center text-xs text-gray-500">{title}</p>
      )}
    </div>
  </div>
);

// One draggable card within the grid — the WHOLE card is the drag handle
// (grab anywhere and move, no small icon to aim for) AND the click target
// for opening the preview. See useClickWithoutDrag above for why "click"
// is detected manually here instead of relying on onClick. No visible
// grip or "⋮" icon anymore — clicking opens the preview (which now carries
// Replace/Delete/Show-in-clips itself).
function MediaTile({ media, index, onPlay, onPreview }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  const handleOpen = () => (media.type === "VIDEO" ? onPlay(media) : onPreview(media));
  const onPointerDown = useClickWithoutDrag(handleOpen);

  return (
    <div
      ref={mergeRefs(ref, handleRef)}
      onPointerDown={onPointerDown}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl border border-gray-100 bg-gray-100 transition-opacity active:cursor-grabbing"
    >
      <span className="absolute left-1.5 top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900/80 px-1 text-[9px] font-bold text-white">
        {index + 1}
      </span>

      <button
        type="button"
        onClick={handleOpen}
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
 * single shared sortOrder sequence. Clicking a tile opens the single-item
 * preview directly (ImageModal/VideoModal), which carries the exact same
 * "⋮" menu (Replace/Delete/Show-in-Video-Clips) as the grid tile itself.
 */
const ShowcaseMediaRow = ({ medias, onDelete, onReplace, onReorder, onToggleClip }) => {
  const [playing, setPlaying] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const safeMedias = Array.isArray(medias) ? medias : [];
  if (safeMedias.length === 0) return null;

  // `previewing`/`playing` are snapshots of the media object taken when the
  // tile was clicked, so a Replace/Delete from inside the modal closes it
  // right away — it can't pick up a changed url or a deletion on its own
  // once the parent reloads the section.
  const handleReplaceFromModal = async (activeMedia, file, closeModal) => {
    if (!activeMedia || !onReplace) return;
    await onReplace(activeMedia._id, file);
    closeModal();
  };

  const handleDeleteFromModal = async (activeMedia, closeModal) => {
    if (!activeMedia || !onDelete) return;
    await onDelete(activeMedia._id);
    closeModal();
  };

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
            onPlay={setPlaying}
            onPreview={setPreviewing}
          />
        ))}
      </div>

      {/* No `title` passed — media.title is just the raw uploaded filename
          (e.g. "images (3)"), not a real caption, so the modal shows the
          media itself with no caption line instead of that raw name. */}
      {playing && (
        <VideoModal
          src={playing.url}
          onClose={() => setPlaying(null)}
          onReplace={onReplace ? (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleReplaceFromModal(playing, file, () => setPlaying(null));
          } : undefined}
          onDelete={onDelete ? () => handleDeleteFromModal(playing, () => setPlaying(null)) : undefined}
          onToggleClip={onToggleClip ? (checked) => onToggleClip(playing._id, checked) : undefined}
          isShowInVideoClips={playing.isShowInVideoClips}
        />
      )}
      {previewing && (
        <ImageModal
          src={previewing.url}
          onClose={() => setPreviewing(null)}
          onReplace={onReplace ? (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleReplaceFromModal(previewing, file, () => setPreviewing(null));
          } : undefined}
          onDelete={onDelete ? () => handleDeleteFromModal(previewing, () => setPreviewing(null)) : undefined}
        />
      )}
    </DragDropProvider>
  );
};

export default ShowcaseMediaRow;
