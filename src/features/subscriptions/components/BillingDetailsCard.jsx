import { useState } from "react";

const BILLING_FIELDS = [
  { key: "brandName", label: "Brand name", type: "text" },
  { key: "address", label: "Address", type: "textarea" },
  { key: "gstin", label: "GSTIN", type: "text" },
  { key: "pan", label: "Pan", type: "text" },
];

export default function BillingDetailsCard({ details, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(details);

  const handleEdit = () => {
    setDraft(details);
    setEditing(true);
  };
  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft(details);
    setEditing(false);
  };
  const handleChange = (key, val) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Billing Details</h3>
        {!editing && (
          <button
            onClick={handleEdit}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {BILLING_FIELDS.map(({ key, label, type }) => (
          <div
            key={key}
            className="px-6 py-4 grid grid-cols-3 capitalize gap-4 items-start"
          >
            <span className="text-sm font-semibold text-gray-700 col-span-1 pt-1">
              {label}
            </span>
            <div className="col-span-2">
              {editing ? (
                type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={draft[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={draft[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                  />
                )
              ) : (
                <span className="text-sm text-gray-600">{details[key] || "—"}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="px-6 py-4 bg-teal-50 border-t border-teal-100 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
