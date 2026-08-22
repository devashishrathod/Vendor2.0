import React, { useRef } from "react";
import { Trash2, Plus, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import ShowcaseMediaRow from "./ShowcaseMediaRow";

const ShowcaseGroup = ({
  group,
  guidelinesLink,
  onAddMedia,
  onDeleteMedia,
  onReplaceMedia,
  onMoveMedia,
  onEditSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  isFirstSection,
  isLastSection,
}) => {
  const fileInputRef = useRef(null);

  const photos = (group.medias || []).filter((m) => m.type === "PHOTO");
  const videos = (group.medias || []).filter((m) => m.type === "VIDEO");

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length && onAddMedia) {
      onAddMedia(group.id, files);
    }
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 capitalize">
            {group.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 capitalize">{group.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <a
            href={guidelinesLink}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Images & Video guidelines
          </a>
          {(onMoveSectionUp || onMoveSectionDown) && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onMoveSectionUp(group.id)}
                disabled={isFirstSection}
                aria-label="Move section up"
                className="text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => onMoveSectionDown(group.id)}
                disabled={isLastSection}
                aria-label="Move section down"
                className="text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-gray-400"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
          {onEditSection && (
            <button
              type="button"
              onClick={() => onEditSection(group.id)}
              aria-label="Edit section"
              className="text-emerald-500 hover:text-emerald-600"
            >
              <Pencil size={16} />
            </button>
          )}
          {onDeleteSection && (
            <button
              type="button"
              onClick={() => onDeleteSection(group.id)}
              aria-label="Delete section"
              className="text-rose-500 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ShowcaseMediaRow
          medias={photos}
          type="image"
          onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
          onReplace={onReplaceMedia ? (mediaId, file) => onReplaceMedia(group.id, mediaId, file) : undefined}
          onMoveUp={onMoveMedia ? (mediaId) => onMoveMedia(group.id, mediaId, "up") : undefined}
          onMoveDown={onMoveMedia ? (mediaId) => onMoveMedia(group.id, mediaId, "down") : undefined}
        />
        <ShowcaseMediaRow
          medias={videos}
          type="video"
          onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
          onReplace={onReplaceMedia ? (mediaId, file) => onReplaceMedia(group.id, mediaId, file) : undefined}
          onMoveUp={onMoveMedia ? (mediaId) => onMoveMedia(group.id, mediaId, "up") : undefined}
          onMoveDown={onMoveMedia ? (mediaId) => onMoveMedia(group.id, mediaId, "down") : undefined}
        />

        {onAddMedia && (
          <div>
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
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/40"
            >
              <Plus size={14} /> Add media
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseGroup;