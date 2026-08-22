import { Music2 } from "lucide-react";

export default function PlaylistChips({ playlists, requests }) {
  if (!playlists.length && !requests.length) return null;

  return (
    <div className="mb-8">
      <p className="text-sm font-semibold text-gray-700 mb-3">Your playlists</p>
      <div className="flex flex-wrap gap-2">
        {playlists.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs text-gray-600"
          >
            <Music2 size={12} className="text-emerald-500" /> {p.name}
          </span>
        ))}
        {requests.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 text-xs text-amber-700"
          >
            {r.name} · requested
          </span>
        ))}
      </div>
    </div>
  );
}
