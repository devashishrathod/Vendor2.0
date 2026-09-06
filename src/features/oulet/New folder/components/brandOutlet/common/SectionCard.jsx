// Matches the onboarding wizard steps' current card treatment (see e.g.
// Step3BusinessName.jsx's form card: bg-white border-gray-50 with a soft
// custom shadow) instead of this page's own heavier border/shadow look, so
// Create Outlet reads as the same theme as the rest of onboarding.
export default function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-50 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
}
