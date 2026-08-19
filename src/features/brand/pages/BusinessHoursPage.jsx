import React, { useState, useEffect } from "react";

import BusinessHours from "../components/BusinessHours";
import { updateBrandDetails } from "../services/brandApi";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Builds a clean { monday: {start,end,isOpen}, ... } object from
// whatever workHours shape the API returned (falls back to closed).
const normalizeHours = (workHours) => {
  const result = {};
  DAY_KEYS.forEach((key) => {
    const day = workHours?.[key];
    result[key] = {
      start: day?.start || "09:00",
      end: day?.end || "18:00",
      isOpen: day?.isOpen ?? false,
    };
  });
  return result;
};

/**
 * BusinessHoursPage
 * "Business Hours" tab — reads brand.firstSubBrand.workHours,
 * lets the user toggle days open/closed and edit start/end times,
 * and saves changes via updateBrandDetails(brandId, { workHours }).
 */
const BusinessHoursPage = ({ brand, brandId, brandLoading, brandError }) => {
  const [hours, setHours] = useState(() => normalizeHours(brand?.firstSubBrand?.workHours));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Re-sync local state whenever fresh brand data comes in
  // (e.g. after a reload).
  useEffect(() => {
    setHours(normalizeHours(brand?.firstSubBrand?.workHours));
  }, [brand]);

  if (brandLoading) {
    return <p className="text-sm text-gray-400">Loading business hours…</p>;
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">No brand data found.</p>;
  }

  const handleToggleDay = (dayKey) => {
    setSaved(false);
    setHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], isOpen: !prev[dayKey].isOpen },
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setSaved(false);
    setHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await updateBrandDetails(brandId, { workHours: hours });
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || "Failed to update business hours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {brandError && (
        <p className="mb-4 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}
      {saveError && (
        <p className="mb-4 text-sm text-red-500">{saveError}</p>
      )}

      <BusinessHours
        hours={hours}
        onToggleDay={handleToggleDay}
        onTimeChange={handleTimeChange}
      />

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600">Saved successfully.</span>
        )}
      </div>
    </div>
  );
};

export default BusinessHoursPage;