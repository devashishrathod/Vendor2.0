import { GUIDELINES } from "../../../constants/brandOutletConstants";

export default function GuidelinesModal({ type, onClose }) {
  const g = GUIDELINES[type];
  if (!g) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-bold text-gray-900">{g.title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {g.sections.map((s, i) => (
            <div key={i}>
              <p className="text-sm font-bold text-gray-800 mb-1">{s.heading}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#2d2d5e] transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
