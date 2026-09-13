import { useState, useRef } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Play, Eye, X, Trash2, Upload, Pencil } from "lucide-react";
import { mergeRefs, noDragRef } from "../utils/BrandHelpers";

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
//
// BOTH the pointerDOWN and pointerUP sides of that tracking must be wired
// up in the CAPTURE phase via real `addEventListener` calls — never as
// plain React `onPointerDown={...}`/`onPointerUp={...}` props. dnd-kit's
// `handleRef` attaches its own real, bubble-phase `pointerdown` listener
// directly on this same DOM node and stops propagation once it recognizes
// the press, and it does the same for `pointerup` once a drag is tracked
// (it also captures the pointer via setPointerCapture, so "up" isn't
// guaranteed to land back on this element at all). A React prop is only
// ever invoked once the native event bubbles all the way up to React's
// single root listener — if dnd-kit stops propagation anywhere along that
// path first, our handler never runs, `startRef` never gets set/read, and
// clicks on the tile silently do nothing. The fix (same one
// BrandHelpers.js's noDragRef uses for the same class of bug): attach our
// own listeners in the CAPTURE phase — guaranteed to run before ANY
// bubble-phase listener dnd-kit attaches, anywhere in the tree, ever sees
// the event.
const CLICK_MOVE_TOLERANCE = 6;

function useClickWithoutDrag(onClickLike) {
  const startRef = useRef(null);

  // Recreated (and thus re-attached, via the ref-callback teardown/setup
  // React runs whenever a callback ref's identity changes) on every
  // render, so this always closes over the latest `onClickLike` — no ref
  // indirection needed to avoid a stale callback.
  const clickRef = (node) => {
    if (!node) return undefined;

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startRef.current = { x: e.clientX, y: e.clientY };
    };

    // Listens on `document` (not just this node) since dnd-kit's pointer
    // capture can redirect where "up" is actually dispatched — but still
    // in the CAPTURE phase, so it runs before dnd-kit's own bubble-phase
    // pointerup handling gets a chance to stop propagation.
    const onPointerUp = (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx <= CLICK_MOVE_TOLERANCE && dy <= CLICK_MOVE_TOLERANCE) onClickLike();
    };

    node.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("pointerup", onPointerUp, { capture: true });
    return () => {
      node.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("pointerup", onPointerUp, { capture: true });
    };
  };

  return clickRef;
}

// Replace/Delete/Edit (+ Show in Video Clips for videos) sit directly in
// the header row now — always visible, no "⋮" click needed to reveal them
// (unlike the compact grid tile, this modal has room to spare).
function ModalActions({ type, onReplace, onDelete, onEdit, onToggleClip, isShowInVideoClips }) {
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
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        >
          <Pencil size={13} /> Edit
        </button>
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
const VideoModal = ({ src, title, onClose, onReplace, onDelete, onEdit, onToggleClip, isShowInVideoClips }) => (
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
          onEdit={onEdit}
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
const ImageModal = ({ src, title, onClose, onReplace, onDelete, onEdit }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5 border-b border-gray-100 p-3">
        <ModalActions type="image" onReplace={onReplace} onDelete={onDelete} onEdit={onEdit} />
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

// "Edit" modal — title/alt text for either media type, plus a thumbnail
// (poster image) file input only when editing a video. Opened from the
// "Edit" action in ModalActions above; pre-fills from the media item's
// current values so the vendor can see what's already saved before
// changing it. ⚠️ The exact request field names (title/altText/thumbnail)
// are NOT independently confirmed from a Postman sample for
// PATCH .../media/update/:mediaId — see updateShowcaseMediaDetails's
// comment in brandApi.js.
function EditMediaModal({ media, onClose, onSave }) {
  const [title, setTitle] = useState(media?.title || "");
  const [altText, setAltText] = useState(media?.altText || "");
  const [thumbnail, setThumbnail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isVideo = media?.type === "VIDEO";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ title, altText, thumbnail: isVideo ? thumbnail : undefined });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Edit {isVideo ? "Video" : "Photo"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambience photo"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Alt Text</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Short description for accessibility"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {isVideo && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Thumbnail (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {thumbnail ? (
                <p className="mt-1 text-xs text-gray-500">{thumbnail.name}</p>
              ) : media?.thumbnail ? (
                <img src={media.thumbnail} alt="" className="mt-2 h-14 w-14 rounded-lg border border-gray-100 object-cover" />
              ) : null}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// One draggable card within the grid — the WHOLE card is the drag handle
// (grab anywhere and move, no small icon to aim for) AND the click target
// for opening the preview. See useClickWithoutDrag above for why "click"
// is detected manually here instead of relying on onClick. No visible
// grip or "⋮" icon anymore — clicking opens the preview (which now carries
// Replace/Delete/Show-in-clips itself). A hover-only "view" (Eye) icon
// signals that the tile is clickable, since a plain photo tile otherwise
// gives no visual hint of that (videos already have their own always-on
// Play icon). A separate hover-only Edit (Pencil) button opens
// EditMediaModal directly from the grid — it needs `ref={noDragRef}` (see
// BrandHelpers.js) since it sits inside the same drag-handle card as
// everything else here, otherwise its own click would get swallowed the
// same way the preview's click almost did.
function MediaTile({ media, index, onPlay, onPreview, onEdit }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  const handleOpen = () => (media.type === "VIDEO" ? onPlay(media) : onPreview(media));
  const clickRef = useClickWithoutDrag(handleOpen);

  return (
    <div
      ref={mergeRefs(ref, handleRef, clickRef)}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="group relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl border border-gray-100 bg-gray-100 transition-opacity active:cursor-grabbing"
    >
      <span className="absolute left-1.5 top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900/80 px-1 text-[9px] font-bold text-white">
        {index + 1}
      </span>

      {onEdit && (
        <button
          type="button"
          ref={noDragRef}
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
          className="absolute right-1.5 top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-white opacity-0 transition-opacity duration-150 hover:bg-gray-900 group-hover:opacity-100"
        >
          <Pencil size={12} />
        </button>
      )}

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
          <>
            <img
              src={media.thumbnail || media.url}
              alt={media.altText || `Photo ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/30 group-hover:opacity-100">
              <Eye size={20} className="text-white drop-shadow" />
            </div>
          </>
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
const ShowcaseMediaRow = ({ medias, onDelete, onReplace, onUpdateDetails, onReorder, onToggleClip }) => {
  const [playing, setPlaying] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [editingMedia, setEditingMedia] = useState(null);

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

  // "Edit" closes whichever preview is open and opens EditMediaModal on
  // top of it instead — simpler than stacking two modals, and the preview
  // can always be reopened from the grid once the edit is saved.
  const handleEditFromModal = (activeMedia) => {
    if (!activeMedia) return;
    setPlaying(null);
    setPreviewing(null);
    setEditingMedia(activeMedia);
  };

  const handleSaveDetails = async (patch) => {
    if (!editingMedia || !onUpdateDetails) return;
    await onUpdateDetails(editingMedia._id, patch);
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
            onEdit={onUpdateDetails ? () => setEditingMedia(media) : undefined}
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
          onEdit={onUpdateDetails ? () => handleEditFromModal(playing) : undefined}
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
          onEdit={onUpdateDetails ? () => handleEditFromModal(previewing) : undefined}
        />
      )}
      {editingMedia && (
        <EditMediaModal
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={handleSaveDetails}
        />
      )}
    </DragDropProvider>
  );
};

export default ShowcaseMediaRow;
