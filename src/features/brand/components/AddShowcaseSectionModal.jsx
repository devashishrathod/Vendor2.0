import React, { useState } from "react";
import { X, Plus, Pencil } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

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
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              {isEdit ? (
                <Pencil size={18} className="text-emerald-500" />
              ) : (
                <Plus size={18} className="text-emerald-500" />
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              {isEdit ? "Edit Showcase Section" : "Add Showcase Section"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <p className="mb-3 text-sm text-red-500">{formError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Section title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambience photo"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Photos / Videos
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFilesChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {files.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
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
                  className="h-4 w-4 rounded border-gray-300 accent-emerald-600 focus:ring-emerald-400"
                />
                <label htmlFor="isShowInVideoClips" className="text-sm text-gray-700">
                  Show in video clips
                </label>
              </div>
            </>
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
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting ? (isEdit ? "Updating…" : "Adding…") : isEdit ? "Update Section" : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShowcaseSectionModal;