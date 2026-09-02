import { useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Trash2, Plus, Pencil, ListOrdered, ImageIcon, Video, GripVertical } from "lucide-react";
import ShowcaseMediaRow from "./ShowcaseMediaRow";

// One draggable row inside the Order panel — same combined media array the
// earlier number-input version reordered, just moved by dragging the
// handle instead of typing a position.
function OrderRow({ media, index }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
    >
      <button
        type="button"
        ref={handleRef}
        aria-label="Drag to reorder"
        className="flex shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      {media.type === "VIDEO" ? (
        <video
          src={media.url}
          muted
          playsInline
          preload="metadata"
          className="h-9 w-9 flex-shrink-0 rounded-md border border-gray-100 object-cover"
        />
      ) : (
        <img
          src={media.thumbnail || media.url}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-md border border-gray-100 object-cover"
        />
      )}
      <span className="min-w-0 flex-1 truncate text-xs text-gray-600">
        {media.title || (media.type === "VIDEO" ? "Video" : "Photo")}
      </span>
    </div>
  );
}

const ShowcaseGroup = ({
  group,
  index,
  onAddMedia,
  onDeleteMedia,
  onReplaceMedia,
  onSetMediaOrder,
  onEditSection,
  onDeleteSection,
}) => {
  const fileInputRef = useRef(null);
  const [showInClips, setShowInClips] = useState(false);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);

  // Registers this whole section as a sortable item within the parent
  // ShowcaseSection's DragDropProvider — handleRef is the actual drag
  // trigger (the grip icon below), ref marks the card's own boundary.
  const { ref, handleRef, isDragging } = useSortable({ id: group.id, index });

  // sortOrder is ONE shared sequence across photos+videos together (per the
  // confirmed PUT /showcase/section/:id/media/reorder contract), so the
  // Order panel below lists them combined — the per-grid badges in
  // ShowcaseMediaRow are just each row's own 1-based position, a simpler
  // "this is photo #3" display cue, not that combined sequence.
  const combinedMedias = group.medias || [];
  const photos = combinedMedias.filter((m) => m.type === "PHOTO");
  const videos = combinedMedias.filter((m) => m.type === "VIDEO");

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length && onAddMedia) {
      onAddMedia(group.id, files, { isShowInVideoClips: showInClips });
    }
    e.target.value = "";
  };

  // Drag-and-drop reorder for media within this section — computes the
  // dragged item's new 1-based position in the combined list and hands it
  // to the SAME onSetMediaOrder(sectionId, mediaId, position) the earlier
  // number-input version used.
  const handleMediaDragEnd = (event) => {
    if (event.canceled || !onSetMediaOrder) return;
    const draggedId = event.operation.source?.id;
    if (draggedId == null) return;
    const idItems = combinedMedias.map((m) => ({ id: m._id }));
    const moved = move(idItems, event);
    const newIndex = moved.findIndex((item) => item.id === draggedId);
    if (newIndex === -1) return;
    onSetMediaOrder(group.id, draggedId, newIndex + 1);
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            ref={handleRef}
            aria-label="Drag to reorder section"
            className="mt-0.5 flex shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          >
            <GripVertical size={16} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-gray-900 capitalize">{group.title}</h3>
            <p className="mt-0.5 text-xs text-gray-400 capitalize">{group.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onSetMediaOrder && combinedMedias.length > 0 && (
            <button
              type="button"
              onClick={() => setOrderPanelOpen((o) => !o)}
              aria-expanded={orderPanelOpen}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                orderPanelOpen
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-600"
              }`}
            >
              <ListOrdered size={13} /> Order
            </button>
          )}
          {onEditSection && (
            <button
              type="button"
              onClick={() => onEditSection(group.id)}
              aria-label="Edit section"
              className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-50"
            >
              <Pencil size={15} />
            </button>
          )}
          {onDeleteSection && (
            <button
              type="button"
              onClick={() => onDeleteSection(group.id)}
              aria-label="Delete section"
              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {orderPanelOpen && (
        <div className="mx-5 mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold text-gray-500">
            Drag to reorder — applies across photos and videos in this section.
          </p>
          <DragDropProvider onDragEnd={handleMediaDragEnd}>
            <div className="space-y-2">
              {combinedMedias.map((media, i) => (
                <OrderRow key={media._id} media={media} index={i} />
              ))}
            </div>
          </DragDropProvider>
        </div>
      )}

      <div className="space-y-5 px-5 pb-5">
        {photos.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <ImageIcon size={14} className="text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Images</h4>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {photos.length} Photo{photos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ShowcaseMediaRow
              medias={photos}
              type="image"
              onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
              onReplace={onReplaceMedia ? (mediaId, file) => onReplaceMedia(group.id, mediaId, file) : undefined}
            />
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <Video size={14} className="text-violet-500" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Videos</h4>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                {videos.length} Video{videos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ShowcaseMediaRow
              medias={videos}
              type="video"
              onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
              onReplace={onReplaceMedia ? (mediaId, file) => onReplaceMedia(group.id, mediaId, file) : undefined}
            />
          </div>
        )}

        {onAddMedia && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-[0.97]"
            >
              <Plus size={14} /> Add Media
            </button>
            <label className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showInClips}
                onChange={(e) => setShowInClips(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-emerald-600 focus:ring-emerald-400"
              />
              Show in video clips
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseGroup;
