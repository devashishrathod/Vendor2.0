import { useState } from "react";
import { X, Plus, Pencil } from "lucide-react";
import DisabledHint from "@/components/common/DisabledHint";

/**
 * AddShowcaseSectionModal
 * Shared form for both:
 *  - POST /showcase/section/add (mode="add", default) — title,
 *    description, optional first-batch media files, isShowInVideoClips.
 *  - PUT /showcase/section/update/:id (mode="edit", pass `section`) —
 *    title + description only; media/visibility are managed elsewhere
 *    (the media rows themselves, and section reordering).
 */
const AddShowcaseSectionModal = ({ mode = "add", section = null, onClose, onSubmit }) => {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(section?.title || "");
  const [description, setDescription] = useState(section?.description || "");
  const [files, setFiles] = useState([]);
  const [isShowInVideoClips, setIsShowInVideoClips] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleThumbnailChange = (e) => {
    setThumbnail(e.target.files?.[0] || null);
  };

  // A video in the batch needs a thumbnail before it can be uploaded; for an
  // image-only batch marked for clips it stays optional.
  const hasVideo = !isEdit && files.some((f) => f.type?.startsWith("video/"));
  const showThumbnailField = hasVideo || isShowInVideoClips;
  const needsThumbnail = hasVideo && !thumbnail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (needsThumbnail) return;

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await onSubmit({ title: title.trim(), description: description.trim() });
      } else {
        await onSubmit({
          title: title.trim(),
          description: description.trim(),
          files,
          isShowInVideoClips,
          thumbnail: showThumbnailField ? thumbnail : null,
        });
      }
      onClose();
    } catch (err) {
      setFormError(err.message || `Failed to ${isEdit ? "update" : "add"} showcase section.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              {isEdit ? (
                <Pencil size={18} className="text-emerald-500 dark:text-emerald-400" />
              ) : (
                <Plus size={18} className="text-emerald-500 dark:text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isEdit ? "Edit Showcase Section" : "Add Showcase Section"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <p className="mb-3 text-sm text-red-500">{formError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Section title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambience photo"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-gray-100 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Photos / Videos
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFilesChange}
                  className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded-xl file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-500/15 dark:file:text-emerald-300 dark:hover:file:bg-emerald-500/25"
                />
                {files.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isShowInVideoClips"
                  type="checkbox"
                  checked={isShowInVideoClips}
                  onChange={(e) => setIsShowInVideoClips(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600 focus:ring-emerald-400"
                />
                <label htmlFor="isShowInVideoClips" className="text-sm text-gray-700 dark:text-gray-300">
                  Show in video clips
                </label>
              </div>

              {/* Required when the batch has a video, optional for an
                  image-only batch marked for video clips — a custom poster
                  image instead of an arbitrary auto-picked video frame.
                  ⚠️ NOT CONFIRMED from Postman: no thumbnail field is
                  documented on add-media yet, so this is sent as a
                  best-effort "thumbnail" form field — verify the real
                  request/response once tested. */}
              {showThumbnailField && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {hasVideo ? (
                      <>
                        Video thumbnail <span className="text-rose-500">(required)</span>
                      </>
                    ) : (
                      "Thumbnail for clips (optional)"
                    )}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded-xl file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-500/15 dark:file:text-emerald-300 dark:hover:file:bg-emerald-500/25"
                  />
                  {thumbnail && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{thumbnail.name}</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <DisabledHint show={needsThumbnail && !submitting} message="Choose a thumbnail for the video">
              <button
                type="submit"
                disabled={submitting || needsThumbnail}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:pointer-events-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none disabled:active:scale-100"
              >
                {submitting ? (isEdit ? "Updating…" : "Adding…") : isEdit ? "Update Section" : "Add Section"}
              </button>
            </DisabledHint>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShowcaseSectionModal;