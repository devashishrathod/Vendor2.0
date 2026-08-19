import React, { useState } from "react";
import { X } from "lucide-react";

const AddShowcaseSectionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        files,
        isShowInVideoClips,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to add showcase section.");
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
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Add Showcase Section
          </h3>
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
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
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
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Photos / Videos
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
            />
            <label htmlFor="isShowInVideoClips" className="text-sm text-gray-700">
              Show in video clips
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShowcaseSectionModal;