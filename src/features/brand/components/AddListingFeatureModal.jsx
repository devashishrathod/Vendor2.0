import React, { useState } from "react";
import { X, Plus, Pencil } from "lucide-react";

/**
 * AddListingFeatureModal
 * Shared form for both:
 *  - POST /brandFeatures/add (mode="add", default) — icon is required.
 *  - PUT /brandFeatures/update/:id (mode="edit", pass `feature`) — icon is
 *    optional; leaving it unset keeps the currently-uploaded icon.
 * Fields: title, description, isActive toggle, icon (image or video) file
 * upload with a live preview.
 */
const AddListingFeatureModal = ({ mode = "add", feature = null, onClose, onSubmit }) => {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(feature?.lfName || "");
  const [description, setDescription] = useState(feature?.description || "");
  const [isActive, setIsActive] = useState(feature?.isActive ?? true);
  const [iconFile, setIconFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!isEdit && !iconFile) {
      setFormError("Please select an icon image or video.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), isActive, iconFile });
      onClose();
    } catch (err) {
      setFormError(err.message || `Failed to ${isEdit ? "update" : "add"} feature.`);
    } finally {
      setSubmitting(false);
    }
  };

  const isVideoPreview = iconFile?.type?.startsWith("video/");
  const currentPreviewUrl = previewUrl || (isEdit ? feature?.iconUrl : null);
  const isVideoCurrentIcon = !previewUrl && isEdit && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(feature?.iconUrl || "");

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
              {isEdit ? "Edit Listing Feature" : "Add Listing Feature"}
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dine-In"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description of this feature"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Icon (image or video){isEdit && " — leave empty to keep the current one"}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {currentPreviewUrl && (
              <div className="mt-2">
                {previewUrl ? (
                  isVideoPreview ? (
                    <video
                      src={currentPreviewUrl}
                      className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={currentPreviewUrl}
                      alt="Preview"
                      className="h-20 w-20 rounded-xl border border-gray-100 object-contain"
                    />
                  )
                ) : isVideoCurrentIcon ? (
                  <video
                    src={currentPreviewUrl}
                    className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={currentPreviewUrl}
                    alt="Current icon"
                    className="h-20 w-20 rounded-xl border border-gray-100 object-contain"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-emerald-600 focus:ring-emerald-400"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>

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
              {submitting ? (isEdit ? "Updating…" : "Adding…") : isEdit ? "Update Feature" : "Add Feature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddListingFeatureModal;