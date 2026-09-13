import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { ImagePlus } from "lucide-react";
import ShowcaseGroup from "./ShowcaseGroup";

const ShowcaseSection = ({
  showcase,
  onAddMore,
  onAddMedia,
  onDeleteMedia,
  onReplaceMedia,
  onUpdateMediaDetails,
  onSetMediaOrder,
  onEditSection,
  onDeleteSection,
  onSetSectionOrder,
  onToggleVisibility,
  onToggleMediaClip,
}) => {
  // Drag-and-drop reorder for sections — computes the dragged section's new
  // 1-based position and hands it to the SAME onSetSectionOrder(id,
  // position) the earlier number-input version used (which itself calls
  // the confirmed PUT /showcase/section/:id/reorder via ShowcasePage.jsx),
  // just driven by a drag gesture instead of typing a number.
  const handleSectionDragEnd = (event) => {
    if (event.canceled || !onSetSectionOrder) return;
    const draggedId = event.operation.source?.id;
    if (draggedId == null) return;
    const idItems = showcase.groups.map((g) => ({ id: g.id }));
    const moved = move(idItems, event);
    const newIndex = moved.findIndex((item) => item.id === draggedId);
    if (newIndex === -1) return;
    onSetSectionOrder(draggedId, newIndex + 1);
  };

  const totalPhotos = showcase.groups.reduce(
    (sum, g) => sum + (g.medias || []).filter((m) => m.type === "PHOTO").length,
    0
  );
  const totalVideos = showcase.groups.reduce(
    (sum, g) => sum + (g.medias || []).filter((m) => m.type === "VIDEO").length,
    0
  );

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Showcase
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{showcase.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(totalPhotos > 0 || totalVideos > 0) && (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {totalPhotos} Photo{totalPhotos !== 1 ? "s" : ""} · {totalVideos} Video{totalVideos !== 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={onAddMore}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200"
          >
            <ImagePlus size={14} /> Add Showcase
          </button>
        </div>
      </div>

      <DragDropProvider onDragEnd={handleSectionDragEnd}>
        <div className="mt-5 space-y-5">
          {showcase.groups.map((group, index) => (
            <ShowcaseGroup
              key={group.id}
              group={group}
              index={index}
              onAddMedia={onAddMedia}
              onDeleteMedia={onDeleteMedia}
              onReplaceMedia={onReplaceMedia}
              onUpdateMediaDetails={onUpdateMediaDetails}
              onSetMediaOrder={onSetMediaOrder}
              onEditSection={onEditSection}
              onDeleteSection={onDeleteSection}
              onToggleVisibility={onToggleVisibility}
              onToggleMediaClip={onToggleMediaClip}
            />
          ))}
        </div>
      </DragDropProvider>
    </section>
  );
};

export default ShowcaseSection;