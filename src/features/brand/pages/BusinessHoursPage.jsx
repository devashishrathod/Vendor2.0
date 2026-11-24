import { useState } from "react";

import { upsertOutletHours } from "@/features/onboarding-v2/services/brandSetupApi";
import { hoursPayload, hoursProblem } from "@/features/onboarding-v2/steps/outlets/outletHelpers";
import BusinessHours from "../components/BusinessHours";
import useProfileRefresh from "../hooks/useProfileRefresh";

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
 * "Business Hours" tab — the hours of the brand's first outlet
 * (brand.firstSubBrand.workHours), saved to that same outlet with
 * POST /workHours/upsert { subBrandId, monday … sunday } (API doc #37).
 * Other outlets' hours are edited from the Outlets page.
 */
const BusinessHoursPage = ({ brand, brandLoading, brandError, reload }) => {
  const outlet = brand?.firstSubBrand ?? null;
  const subBrandId = outlet?._id || brand?.firstSubBrandId || null;
  const serverHours = outlet?.workHours;
  const [hours, setHours] = useState(() => normalizeHours(serverHours));
  const [syncedFrom, setSyncedFrom] = useState(serverHours);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const refresh = useProfileRefresh(reload);

  // Fresh brand data (e.g. after a reload) → show the saved hours again.
  if (serverHours !== syncedFrom) {
    setSyncedFrom(serverHours);
    setHours(normalizeHours(serverHours));
  }

  if (brandLoading) {
    return <p className="text-sm text-gray-400">Loading business hours…</p>;
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">No brand data found.</p>;
  }

  if (!subBrandId) {
    return <p className="text-sm text-gray-500">Add an outlet first — business hours belong to an outlet.</p>;
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
    const problem = hoursProblem(hours);
    if (problem) {
      setSaveError(problem);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await upsertOutletHours(subBrandId, hoursPayload(hours));
      setSaved(true);
      await refresh();
    } catch (err) {
      console.error("Business hours update failed:", err);
      setSaveError(err.message || "Failed to update business hours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {brandError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}
      {saveError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">{saveError}</p>
      )}
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Hours of your outlet{outlet?.uniqueId ? ` ${outlet.uniqueId}` : ""}. Other outlets are set from the Outlets page.
      </p>

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
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97] disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Saved successfully.
          </span>
        )}
      </div>
    </div>
  );
};

export default BusinessHoursPage;
