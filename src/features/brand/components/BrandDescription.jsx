import React, { useState } from "react";
import {
  Undo2,
  Redo2,
  Bold,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link2,
  Paperclip,
} from "lucide-react";

const TOOLBAR_ICONS = [
  { icon: Undo2, label: "Undo" },
  { icon: Redo2, label: "Redo" },
  { icon: Bold, label: "Bold" },
  { icon: Underline, label: "Underline" },
  { icon: AlignLeft, label: "Align left" },
  { icon: AlignCenter, label: "Align center" },
  { icon: AlignRight, label: "Align right" },
  { icon: List, label: "List" },
  { icon: Link2, label: "Link" },
  { icon: Paperclip, label: "Attach" },
];

const BrandDescription = ({
  subtitle = "Grow your business with better visibility, attractive offers, and customer trust.",
  description,
  lastUpdate,
  onDescriptionChange,
  onUpdate,
}) => {
  const [value, setValue] = useState(description || "");

  const handleChange = (e) => {
    setValue(e.target.value);
    onDescriptionChange && onDescriptionChange(e.target.value);
  };

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
        Brand Description
      </h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

      <div className="mt-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1">
            {TOOLBAR_ICONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          {lastUpdate && (
            <span className="shrink-0 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Last update : {lastUpdate}
            </span>
          )}
        </div>

        <textarea
          value={value}
          onChange={handleChange}
          rows={10}
          className="w-full resize-none rounded-b-xl px-4 py-4 text-sm leading-relaxed text-gray-700 focus:outline-none"
          placeholder="Write your brand description..."
        />
      </div>

      <button
        type="button"
        onClick={() => onUpdate && onUpdate(value)}
        className="mt-4 w-full rounded-lg bg-blue-50 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
      >
        Update Description
      </button>
    </section>
  );
};

export default BrandDescription;