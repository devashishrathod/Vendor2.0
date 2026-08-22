// Native <input type="time"> renders its own hour/minute dropdown in
// whatever 24h/12h format the OS locale dictates — there's no HTML/CSS
// lever to force an AM/PM column into that native picker. This is a small
// custom-built replacement whose dropdown always shows one, while still
// reading/writing the exact same "HH:mm" (24h) string the rest of the
// form already works with — callers don't need to change anything else.
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS = ["AM", "PM"];

function parseValue(value) {
  if (!value) return { hour12: null, minute: null, period: null };
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return { hour12: null, minute: null, period: null };
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, period };
}

function to24Hour(hour12, minute, period) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function TimePickerAmPm({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const parsed = parseValue(value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hour12 = parsed.hour12 ?? 12;
  const minute = parsed.minute ?? 0;
  const period = parsed.period ?? "AM";

  const pick = (nextHour12, nextMinute, nextPeriod) => {
    onChange(to24Hour(nextHour12, nextMinute, nextPeriod));
  };

  const displayLabel = value
    ? `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`
    : "--:-- --";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        <span className={value ? "text-gray-700" : "text-gray-400"}>{displayLabel}</span>
        <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="max-h-48 w-14 overflow-y-auto border-r border-gray-100">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => pick(h, minute, period)}
                className={`block w-full px-3 py-1.5 text-center text-sm transition-colors ${
                  h === hour12 ? "bg-emerald-500 font-bold text-white" : "text-gray-600 hover:bg-emerald-50"
                }`}
              >
                {String(h).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="max-h-48 w-14 overflow-y-auto border-r border-gray-100">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => pick(hour12, m, period)}
                className={`block w-full px-3 py-1.5 text-center text-sm transition-colors ${
                  m === minute ? "bg-emerald-500 font-bold text-white" : "text-gray-600 hover:bg-emerald-50"
                }`}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="w-14">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  pick(hour12, minute, p);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-center text-sm transition-colors ${
                  p === period ? "bg-emerald-500 font-bold text-white" : "text-gray-600 hover:bg-emerald-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
