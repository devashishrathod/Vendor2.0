import { WEEK_DAYS } from "../../constants/brandOutletConstants";

// Shape produced: { monday: { start, end, isOpen }, ..., sunday: {...} }
// `onSave` is optional — pass it so this editor can persist hours on its
// own via workHours/upsert instead of waiting for the final Create step.
export default function WorkingHoursEditor({ hours, onChange, onSave, saving = false }) {
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

  return (
    <div>
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