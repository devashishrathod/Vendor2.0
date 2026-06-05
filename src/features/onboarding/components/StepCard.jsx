// ── Shared wrapper card for all steps ────────────────────────────────────────
export default function StepCard({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm mx-auto ${className}`}
      style={{ animation: "stepIn 0.3s ease both" }}
    >
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {title && <h2 className="text-base font-bold text-gray-900 mb-1">{title}</h2>}
      {subtitle && <p className="text-xs text-gray-400 mb-4 leading-relaxed">{subtitle}</p>}
      {children}
    </div>
  );
}