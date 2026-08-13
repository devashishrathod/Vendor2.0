import React from "react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const BusinessHours = ({ hours = {}, onToggleDay, onTimeChange }) => {
  return (
    <div className="rounded-xl border border-gray-100 shadow-sm">
      {DAYS.map((day, idx) => {
        const dayData = hours[day.key] || { start: "", end: "", isOpen: false };

        return (
          <div
            key={day.key}
            className={`flex flex-wrap items-center gap-4 px-5 py-4 ${
              idx !== DAYS.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <div className="flex w-32 shrink-0 items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={dayData.isOpen}
                onClick={() => onToggleDay(day.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  dayData.isOpen ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    dayData.isOpen ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {day.label}
              </span>
            </div>

            {dayData.isOpen ? (
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <input
                  type="time"
                  value={dayData.start || ""}
                  onChange={(e) =>
                    onTimeChange(day.key, "start", e.target.value)
                  }
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-sm text-gray-400">to</span>
                <input
                  type="time"
                  value={dayData.end || ""}
                  onChange={(e) =>
                    onTimeChange(day.key, "end", e.target.value)
                  }
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : (
              <span className="flex-1 text-sm text-gray-400">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BusinessHours;