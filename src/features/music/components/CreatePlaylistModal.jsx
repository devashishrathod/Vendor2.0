import { useState } from "react";
import { X } from "lucide-react";

export default function CreatePlaylistModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Create playlist</h3>
        <p className="text-sm text-gray-400 mb-4">Give your playlist a name to get started.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Evening Drive"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <button
          disabled={!name.trim() || saving}
          onClick={handleCreate}
          className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-emerald-600 transition-colors"
        >
          {saving ? "Creating…" : "Create playlist"}
        </button>
      </div>
    </div>
  );
}
