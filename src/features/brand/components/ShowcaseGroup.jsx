import { useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Trash2, Plus, ListOrdered, GripVertical } from "lucide-react";
import ShowcaseMediaRow from "./ShowcaseMediaRow";
import { noDragRef } from "../utils/BrandHelpers";
import ConfirmModal from "@/components/common/ConfirmModal";

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
        {media.type === "VIDEO" ? "Video" : "Photo"}
      </span>
    </div>
  );
}

// Small on/off switch shared by both "Show in Clips" controls in this
// header — the persisted section-visibility one and the plain local
// upload-default one below — instead of one being a toggle and the other
// a plain checkbox.
function ToggleSwitch({ label, checked, onChange, hoverLabel }) {
  return (
    <label className="flex items-center gap-2 text-[11px] font-medium text-gray-500" title={hoverLabel}>
      {label}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-label={hoverLabel || label}
        aria-pressed={checked}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

const ShowcaseGroup = ({
  group,
  index,
  onAddMedia,
  onDeleteMedia,
  onReplaceMedia,
  onSetMediaOrder,
  onDeleteSection,
  onToggleVisibility,
  onToggleMediaClip,
}) => {
  const fileInputRef = useRef(null);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Registers this whole section as a sortable item within the parent
  // ShowcaseSection's DragDropProvider. The header row (title/subtitle area)
  // is the drag handle — grab anywhere on it, not just the small grip icon.
  // The header's own buttons (Add Media, Order, Edit, Delete) sit in a
  // wrapper using noDragRef so a click on them never gets swallowed into a
  // drag — see noDragRef's comment for why stopPropagation alone can't do
  // this reliably.
  const { ref, handleRef, isDragging } = useSortable({ id: group.id, index });

  // sortOrder is ONE shared sequence across photos+videos together (per the
  // confirmed PUT /showcase/section/:id/media/reorder contract) — photos
  // and videos are shown together in a single grid below, matching that
  // sequence directly instead of splitting into separate rows.
  const combinedMedias = group.medias || [];

  // Whether new uploads show in video clips is now set per-video AFTER
  // upload (each tile's "⋮" menu), not chosen upfront — avoids a second,
  // confusingly-similarly-labeled "Show in clips" control in this header.
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length && onAddMedia) {
      onAddMedia(group.id, files, { isShowInVideoClips: false });
    }
    e.target.value = "";
  };

  // Drag-and-drop reorder for media within this section — computes the
  // dragged item's new 1-based position in the combined list and hands it
  // to the SAME onSetMediaOrder(sectionId, mediaId, position) the earlier
  // number-input version used. Shared by both the Order panel below and
  // the main grid (ShowcaseMediaRow's own drag handling calls this same
  // shape via its onReorder prop).
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
      className="overflow-hidden rounded-xl border border-gray-100 bg-white"
    >
      <div
        ref={handleRef}
        className="flex flex-wrap items-start justify-between gap-3 p-4 pb-3 cursor-grab touch-none active:cursor-grabbing"
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="mt-0.5 flex shrink-0 items-center justify-center text-gray-300"
          >
            <GripVertical size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 capitalize">{group.title}</h3>
            <p className="mt-0.5 text-xs text-gray-400 capitalize">{group.subtitle}</p>
          </div>
          {onToggleVisibility && (
            <div ref={noDragRef} className="ml-1 flex-shrink-0">
              <ToggleSwitch
                label="Section Visibility"
                checked={!!group.isVisible}
                onChange={(next) => onToggleVisibility(group.id, next)}
                hoverLabel={group.isVisible ? "Hide from customers" : "Visible to Customers"}
              />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2" ref={noDragRef}>
          {onAddMedia && (
            <>
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
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-600 active:scale-[0.97]"
              >
                <Plus size={13} /> Add Media
              </button>
            </>
          )}
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
          {onDeleteSection && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete section"
              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {orderPanelOpen && (
        <div className="mx-4 mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
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

      <div className="px-4 pb-4">
        <ShowcaseMediaRow
          medias={combinedMedias}
          onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
          onReplace={onReplaceMedia ? (mediaId, file) => onReplaceMedia(group.id, mediaId, file) : undefined}
          onReorder={onSetMediaOrder ? (mediaId, newPosition) => onSetMediaOrder(group.id, mediaId, newPosition) : undefined}
          onToggleClip={onToggleMediaClip ? (mediaId, next) => onToggleMediaClip(group.id, mediaId, next) : undefined}
        />
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete this section?"
          description={`"${group.title}" and all its photos/videos will be permanently removed. This action can't be undone.`}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDeleteSection(group.id);
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
};

export default ShowcaseGroup;
