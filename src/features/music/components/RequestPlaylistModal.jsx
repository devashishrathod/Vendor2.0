import { useState } from "react";
import { X, Send } from "lucide-react";

export default function RequestPlaylistModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), note: note.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Request a new playlist</h3>
        <p className="text-sm text-gray-400 mb-4">Tell us what you'd like curated and we'll add it.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the vibe, language, or artist you want..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <button
          disabled={!name.trim() || submitting}
          onClick={handleSubmit}
          className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-gray-800 transition-colors"
        >
          <Send size={14} /> {submitting ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}
