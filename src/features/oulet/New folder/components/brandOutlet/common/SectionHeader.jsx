export default function SectionHeader({ title, subtitle, guidelineKey, onGuidelineClick }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {guidelineKey && (
        <button
          onClick={() => onGuidelineClick(guidelineKey)}
          className="text-sm text-blue-500 hover:underline whitespace-nowrap ml-4 mt-0.5 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          More Guidelines
        </button>
      )}
    </div>
  );
}
