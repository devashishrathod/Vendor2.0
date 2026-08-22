export default function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
}
