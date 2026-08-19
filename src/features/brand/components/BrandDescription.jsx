import React, { useState, useEffect } from "react";

/**
 * BrandDescription
 * Displays the brand's description with an inline edit mode.
 * Pure UI component — no data fetching or API calls here.
 *
 * Props:
 *  - description (string): current description text
 *  - lastUpdate (string|null): formatted "Last update" date, or null
 *  - onUpdate (fn): called with the new description string on save
 */
const BrandDescription = ({ description, lastUpdate, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(description || "");

  // Keep local draft in sync if the underlying description changes
  // (e.g. after a fresh fetch/reload).
  useEffect(() => {
    setDraft(description || "");
  }, [description]);

  const handleEditClick = () => {
    setDraft(description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(description || "");
    setIsEditing(false);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onUpdate(trimmed);
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Brand Description
        </h3>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="text-sm text-emerald-600 font-medium hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe your brand…"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleSave}
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {description || "No description added yet."}
          </p>
          {lastUpdate && (
            <p className="mt-3 text-xs text-gray-400">
              Last update: {lastUpdate}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default BrandDescription;