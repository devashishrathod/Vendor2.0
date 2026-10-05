import { useState } from "react";
import { WEEK_DAYS } from "../../constants/brandOutletConstants";

function daysAreUniform(hours) {
  const first = hours[WEEK_DAYS[0].key];
  if (!first) return true;
  return WEEK_DAYS.every((d) => {
    const v = hours[d.key];
    return v?.start === first.start && v?.end === first.end && v?.isOpen === first.isOpen;
  });
}

// Shape produced: { monday: { start, end, isOpen }, ..., sunday: {...} }
// `onSave` is optional — pass it so this editor can persist hours on its
// own via workHours/upsert instead of waiting for the final Create step.
// `hydrated` should flip true once the parent's real (possibly hydrated)
// hours have landed — the "same every day" vs "custom" mode defaults off
// whichever mode actually matches `hours` at that point, not at mount time
// (when `hours` is still just the always-uniform DEFAULT_WORKING_HOURS).
export default function WorkingHoursEditor({ hours, onChange, onSave, saving = false, hydrated = true }) {
  const [mode, setMode] = useState(() => (daysAreUniform(hours) ? "same" : "custom"));
  const [prevHydrated, setPrevHydrated] = useState(hydrated);

  // Re-derive the default mode once (right when hydration lands, if it
  // hasn't already on first render) — adjusted during render rather than in
  // an effect, per React's guidance for state that needs to track a prop.
  // After this, mode is fully user-controlled via the toggle below.
  if (hydrated && !prevHydrated) {
    setPrevHydrated(hydrated);
    setMode(daysAreUniform(hours) ? "same" : "custom");
  }

  const updateDay = (dayKey, patch) => {
    onChange({ ...hours, [dayKey]: { ...hours[dayKey], ...patch } });
  };

  const copyMondayToAll = () => {
    const mon = hours.monday;
    const next = { ...hours };
    WEEK_DAYS.forEach((d) => {
      next[d.key] = { ...mon };
    });
    onChange(next);
  };

  // "Same every day" mode writes identical values into every day key,
  // through the exact same onChange({...}) contract "Custom" already uses
  // — the underlying data shape and workHours/upsert payload are unaffected
  // either way, this is purely a display/editing shortcut.
  const sameDayValue = hours.monday || { start: "09:00", end: "18:00", isOpen: false };
  const updateSameDay = (patch) => {
    const next = { ...sameDayValue, ...patch };
    const nextHours = {};
    WEEK_DAYS.forEach((d) => {
      nextHours[d.key] = { ...next };
    });
    onChange(nextHours);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("same")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mode === "same"
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
            }`}
        >
          Same every day
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mode === "custom"
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
            }`}
        >
          Custom hours
        </button>
      </div>

      {mode === "same" ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
          <label className="flex items-center gap-2 cursor-pointer sm:w-32 sm:shrink-0">
            <input
              type="checkbox"
              checked={!!sameDayValue.isOpen}
              onChange={(e) => updateSameDay({ isOpen: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Open</span>
          </label>
          {sameDayValue.isOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={sameDayValue.start || ""}
                onChange={(e) => updateSameDay({ start: e.target.value })}
                className="rounded-lg px-3 py-1.5 text-sm outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="time"
                value={sameDayValue.end || ""}
                onChange={(e) => updateSameDay({ end: e.target.value })}
                className="rounded-lg px-3 py-1.5 text-sm outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
              />
            </div>
          ) : (
            <span className="text-xs font-semibold text-gray-400">Closed every day</span>
          )}
          <p className="text-xs text-gray-400 sm:ml-auto">Applies to all 7 days.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <p className="text-xs text-gray-400">Toggle a day open, then set its start and end time.</p>
            <button
              onClick={copyMondayToAll}
              type="button"
              className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap self-start sm:self-auto"
            >
              Copy Monday to all days
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl overflow-hidden">
            {WEEK_DAYS.map((day) => {
              const value = hours[day.key] || { start: "", end: "", isOpen: false };
              return (
                <div
                  key={day.key}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 ${value.isOpen ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/40"}`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-32 sm:shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!value.isOpen}
                        onChange={(e) => updateDay(day.key, { isOpen: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      />
                      <span className={`text-sm font-semibold ${value.isOpen ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>
                        {day.label}
                      </span>
                    </label>
                    {!value.isOpen && (
                      <span className="text-xs font-semibold text-gray-400 sm:hidden">Closed</span>
                    )}
                  </div>

                  {value.isOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={value.start || ""}
                        onChange={(e) => updateDay(day.key, { start: e.target.value })}
                        className="rounded-lg px-3 py-1.5 text-sm outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="time"
                        value={value.end || ""}
                        onChange={(e) => updateDay(day.key, { end: e.target.value })}
                        className="rounded-lg px-3 py-1.5 text-sm outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100"
                      />
                    </div>
                  ) : (
                    <span className="hidden sm:inline text-xs font-semibold text-gray-400 sm:ml-auto">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {onSave && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full sm:w-auto bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Working Hours"}
          </button>
        </div>
      )}
    </div>
  );
}
