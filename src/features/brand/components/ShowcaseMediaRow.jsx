import { useState, useRef } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Play, Eye, X, Trash2, Upload, Pencil, RotateCcw } from "lucide-react";
import { mergeRefs, noDragRef } from "../utils/BrandHelpers";
import { LocalFileThumb } from "./StagedFiles";

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

  // Hand the File itself on — clearing the input empties e.target.files, so
  // the old onReplace(e) read nothing and Replace never uploaded.
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onReplace?.(file);
  };

  return (
    <>
      {type === "video" && onToggleClip && (
        <label
          title={isShowInVideoClips ? "Hide from video clips" : "Show in video clips"}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <input
            type="checkbox"
            checked={!!isShowInVideoClips}
            onChange={(e) => onToggleClip(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-emerald-600 focus:ring-emerald-400"
          />
          Show in Video Clips
        </label>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Upload size={13} /> Replace
          </button>
        </>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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
      className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5 p-3">
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
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-center bg-gray-50 dark:bg-gray-700 p-5">
        <video src={src} controls autoPlay className="max-h-[50vh] rounded-xl">
          Your browser doesn't support video playback.
        </video>
      </div>
      {title && (
        <p className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{title}</p>
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
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5 p-3">
        <ModalActions type="image" onReplace={onReplace} onDelete={onDelete} onEdit={onEdit} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex justify-center bg-gray-50 dark:bg-gray-700 p-5">
        <img
          src={src}
          alt={title || "Preview"}
          className="max-h-[50vh] rounded-xl object-contain"
        />
      </div>
      {title && (
        <p className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{title}</p>
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
//
// Replace / Remove live here too: Replace only STAGES the new file (preview
// + Undo) and it uploads on Save; Remove deletes after an in-modal confirm.
function EditMediaModal({ media, onClose, onSave, onReplace, onRemove }) {
  const [title, setTitle] = useState(media?.title || "");
  const [altText, setAltText] = useState(media?.altText || "");
  const [thumbnail, setThumbnail] = useState(null);
  const [replacement, setReplacement] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const replaceInputRef = useRef(null);
  const busy = submitting || removing;
  const isVideo = media?.type === "VIDEO";

  const handleReplacePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setReplacement(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // The file goes up first (media/replace), then title / alt text /
      // thumbnail are saved on the same item (media/update).
      if (replacement && onReplace) await onReplace(replacement);
      await onSave({ title, altText, thumbnail: isVideo && !replacement ? thumbnail : undefined });
      onClose();
    } catch (err) {
      setError(err?.message || "Couldn't save the changes.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError("");
    try {
      await onRemove();
      onClose();
    } catch (err) {
      setError(err?.message || "Couldn't remove this item.");
      setRemoving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Edit {isVideo ? "Video" : "Photo"}</h3>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* The item being edited (or its staged replacement). */}
        <div className="relative mb-2 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900">
          {replacement ? (
            <LocalFileThumb file={replacement} contain />
          ) : isVideo ? (
            <video src={media?.url} className="h-full w-full object-contain" controls muted playsInline preload="metadata" />
          ) : (
            <img src={media?.url} alt={media?.altText || ""} className="h-full w-full object-contain" />
          )}
          {replacement && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10.5px] font-semibold text-white">
              New — replaces on Save
            </span>
          )}
        </div>

        {(onReplace || onRemove) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {confirmRemove ? (
              <div className="flex w-full items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
                <span className="min-w-0 flex-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Remove this {isVideo ? "video" : "photo"} permanently?
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  disabled={removing}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {removing ? "Removing…" : "Remove"}
                </button>
              </div>
            ) : replacement ? (
              <>
                <span className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400" title={replacement.name}>
                  {replacement.name}
                </span>
                <button
                  type="button"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Upload size={13} /> Pick another
                </button>
                <button
                  type="button"
                  onClick={() => setReplacement(null)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                >
                  <RotateCcw size={13} /> Undo
                </button>
              </>
            ) : (
              <>
                {onReplace && (
                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    <Upload size={13} /> Replace
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </>
            )}
            <input
              ref={replaceInputRef}
              type="file"
              accept={isVideo ? "video/*" : "image/*"}
              onChange={handleReplacePick}
              className="hidden"
            />
          </div>
        )}

        {error && <p className="mb-3 text-xs text-rose-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambience photo"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Alt Text</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Short description for accessibility"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Thumbnail belongs to the current video — hidden while a new
              file is staged (media/replace only takes the file). */}
          {isVideo && !replacement && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Thumbnail (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded-xl file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-500/15 dark:file:text-emerald-300 dark:hover:file:bg-emerald-500/25"
              />
              {thumbnail ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{thumbnail.name}</p>
              ) : media?.thumbnail ? (
                <img src={media.thumbnail} alt="" className="mt-2 h-14 w-14 rounded-lg object-cover" />
              ) : null}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {submitting ? (replacement ? "Replacing…" : "Saving…") : replacement ? "Replace & Save" : "Save Changes"}
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
      className="group relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 transition-opacity active:cursor-grabbing"
    >
      <span className="absolute left-1.5 top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900/80 px-1 text-[9px] font-bold text-white">
        {index + 1}
      </span>

      {/* Hover actions: View + Edit (noDragRef so a click never turns
          into a drag). */}
      <div className="absolute right-1.5 top-1.5 z-20 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          ref={noDragRef}
          onClick={handleOpen}
          aria-label="View"
          title="View"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-white hover:bg-gray-900"
        >
          <Eye size={12} />
        </button>
        {onEdit && (
          <button
            type="button"
            ref={noDragRef}
            onClick={onEdit}
            aria-label="Edit"
            title="Edit"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-white hover:bg-gray-900"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

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
            {/* Hover dim — the corner View button carries the eye now. */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/20" />
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
  // A failed call leaves the preview open — ShowcasePage already shows the
  // error banner, so it's only swallowed here.
  const handleReplaceFromModal = async (activeMedia, file, closeModal) => {
    if (!activeMedia || !onReplace) return;
    try {
      await onReplace(activeMedia._id, file);
      closeModal();
    } catch {
      /* shown by ShowcasePage */
    }
  };

  const handleDeleteFromModal = async (activeMedia, closeModal) => {
    if (!activeMedia || !onDelete) return;
    try {
      await onDelete(activeMedia._id);
      closeModal();
    } catch {
      /* shown by ShowcasePage */
    }
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
          onReplace={onReplace ? (file) => handleReplaceFromModal(playing, file, () => setPlaying(null)) : undefined}
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
          onReplace={onReplace ? (file) => handleReplaceFromModal(previewing, file, () => setPreviewing(null)) : undefined}
          onDelete={onDelete ? () => handleDeleteFromModal(previewing, () => setPreviewing(null)) : undefined}
          onEdit={onUpdateDetails ? () => handleEditFromModal(previewing) : undefined}
        />
      )}
      {editingMedia && (
        <EditMediaModal
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={handleSaveDetails}
          onReplace={onReplace ? (file) => onReplace(editingMedia._id, file) : undefined}
          onRemove={onDelete ? () => onDelete(editingMedia._id) : undefined}
        />
      )}
    </DragDropProvider>
  );
};

export default ShowcaseMediaRow;
