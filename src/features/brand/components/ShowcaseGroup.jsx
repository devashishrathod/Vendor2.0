import React, { useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import ShowcaseMediaRow from "./ShowcaseMediaRow";

const ShowcaseGroup = ({
  group,
  guidelinesLink,
  onAddMedia,
  onDeleteMedia,
  onDeleteSection,
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
          <h3 className="text-sm font-semibold text-gray-900 capitalize">
            {group.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 capitalize">{group.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <a
            href={guidelinesLink}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Images & Video guidelines
          </a>
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
        />
        <ShowcaseMediaRow
          medias={videos}
          type="video"
          onDelete={(mediaId) => onDeleteMedia(group.id, mediaId)}
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
              className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
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