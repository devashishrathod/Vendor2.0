// Matches the onboarding wizard steps' card treatment exactly (see e.g.
// Step3BusinessName.jsx's form card: bg-white border-gray-100 shadow-sm)
// instead of this page's own heavier border-gray-200/no-shadow look, so
// Create Outlet reads as the same theme as the rest of onboarding.
export default function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
}
