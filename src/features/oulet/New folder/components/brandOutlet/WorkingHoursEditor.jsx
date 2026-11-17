import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
      {/* Mode switch */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700" role="tablist" aria-label="Hours mode">
        {[
          { value: "same", label: "Same every day" },
          { value: "custom", label: "Custom hours" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => setMode(tab.value)}
            className={`min-h-8 rounded-lg px-3 text-xs font-bold transition-colors ${
              mode === tab.value
                ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "same" ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-700">
          <DayToggle checked={!!sameDayValue.isOpen} onChange={(isOpen) => updateSameDay({ isOpen })} label="Open every day" />
          <span className={`w-16 shrink-0 text-[12.5px] font-bold ${sameDayValue.isOpen ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>
            All days
          </span>
          {sameDayValue.isOpen ? (
            <TimeRange
              start={sameDayValue.start}
              end={sameDayValue.end}
              onStart={(start) => updateSameDay({ start })}
              onEnd={(end) => updateSameDay({ end })}
            />
          ) : (
            <ClosedTag />
          )}
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400">Toggle a day on, then set its times.</p>
            <button
              onClick={copyMondayToAll}
              type="button"
              className="whitespace-nowrap text-[11.5px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Copy Mon to all
            </button>
          </div>

          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {WEEK_DAYS.map((day) => {
              const value = hours[day.key] || { start: "", end: "", isOpen: false };
              return (
                <li
                  key={day.key}
                  className={`flex min-h-12 items-center gap-2.5 px-3 py-1.5 ${value.isOpen ? "" : "bg-gray-50/70 dark:bg-gray-900/30"}`}
                >
                  <DayToggle checked={!!value.isOpen} onChange={(isOpen) => updateDay(day.key, { isOpen })} label={`${day.label} open`} />
                  <span
                    title={day.label}
                    className={`w-9 shrink-0 text-[12.5px] font-bold ${value.isOpen ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}
                  >
                    {day.label.slice(0, 3)}
                  </span>
                  {value.isOpen ? (
                    <TimeRange
                      start={value.start}
                      end={value.end}
                      onStart={(start) => updateDay(day.key, { start })}
                      onEnd={(end) => updateDay(day.key, { end })}
                    />
                  ) : (
                    <ClosedTag />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border-[1.5px] border-emerald-500 bg-white text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-500/10"
        >
          {saving ? "Saving…" : "Save working hours"}
        </button>
      )}
    </div>
  );
}

/** 32×18 switch, as in the design. */
function DayToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex min-h-6 shrink-0 items-center"
    >
      <span className={`block h-[18px] w-8 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
      <span
        className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-[left] ${checked ? "left-[16px]" : "left-[2px]"}`}
      />
    </button>
  );
}

/** "Closed" tag shown in place of the times. */
function ClosedTag() {
  return (
    <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Closed
    </span>
  );
}

// Every 15 minutes, as "HH:MM" (what the API stores) → "9:00 AM" (what the
// vendor sees). A select instead of <input type="time"> so AM/PM always
// shows — the native input follows the OS clock and drops AM/PM on 24-hour systems.
const to12h = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const period = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
};
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const value = `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
  return { value, label: to12h(value) };
});

function TimeSelect({ value, onChange, label }) {
  // A saved time off the 15-minute grid (e.g. 09:10) still shows as itself.
  const options = value && !TIME_OPTIONS.some((o) => o.value === value) ? [{ value, label: to12h(value) }, ...TIME_OPTIONS] : TIME_OPTIONS;
  return (
    <div className="relative min-w-0">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-2 pr-6 text-[12.5px] font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]"
      >
        {!value && (
          <option value="" disabled>
            --:--
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
    </div>
  );
}

/** Compact start – end times (12-hour, AM/PM) on the same line as the day. */
function TimeRange({ start, end, onStart, onEnd }) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-1.5">
      <TimeSelect value={start} onChange={onStart} label="Opens at" />
      <span className="text-xs font-semibold text-gray-400" aria-hidden="true">
        –
      </span>
      <TimeSelect value={end} onChange={onEnd} label="Closes at" />
    </div>
  );
}
