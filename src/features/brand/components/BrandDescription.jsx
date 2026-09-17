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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900 leading-tight">Brand Description</h2>
            <p className="text-xs text-gray-400 mt-0.5">Describe your brand and its unique value proposition</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
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
            className="w-full rounded-xl border border-gray-200 p-3.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Describe your brand…"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold rounded-xl shadow-sm shadow-emerald-100 transition-all duration-200"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 whitespace-pre-wrap pl-12">
            {description || "No description added yet."}
          </p>
          {lastUpdate && (
            <p className="mt-3 text-xs text-gray-400 pl-12">
              Last update: {lastUpdate}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default BrandDescription;