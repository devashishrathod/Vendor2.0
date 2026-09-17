import { Music } from "lucide-react";

// Clicking a pill opens that language's own album page (same pattern as
// every other collection in this feature) — there's no lasting "active"
// pill since the click navigates away.
export default function LanguagePills({ languages, onSelect }) {
  if (!languages.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Choose Language</h3>
          <p className="text-xs text-gray-400 mt-0.5">Browse music in your preferred language</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => onSelect(lang)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border bg-white border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-600 transition-colors"
          >
            <Music size={12} /> {lang.label}
          </button>
        ))}
      </div>
    </section>
  );
}
