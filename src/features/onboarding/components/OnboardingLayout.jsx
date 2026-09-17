import Sidebar from "@/features/onboarding/components/Sidebar";
import SuccessToast from "@/components/common/SuccessToast";

function MobileHeader({ title, sub, onMenuOpen, pct, displayIndex, totalSteps, isLast }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between
      px-4 py-2.5 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center rounded-xl
            bg-gray-50 border border-gray-200 text-gray-800 hover:bg-emerald-50
            hover:border-emerald-200 hover:text-emerald-600 transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-extrabold text-gray-900 leading-tight">{title}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[160px]">{sub}</p>
        </div>
      </div>

      {!isLast && (
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-emerald-600">Step {displayIndex} of {totalSteps}</p>
            <p className="text-[9px] text-gray-400">{pct}% Complete</p>
          </div>
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${pct * 0.879} ${87.9 - pct * 0.879}`} strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center
              text-[9px] font-black text-emerald-600">
              {pct}%
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileSidebarDrawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 left-0 z-50 lg:hidden"
        style={{ animation: "drawerIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}
      >
        <style>{`
          @keyframes drawerIn {
            from { transform: translateX(-100%); opacity: 0.6; }
            to   { transform: translateX(0);     opacity: 1; }
          }
        `}</style>
        <div className="absolute top-4 right-[-44px] z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl
              bg-white shadow-md text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/**
 * OnboardingLayout — the shared shell around every onboarding step:
 * sidebar (desktop + mobile drawer), header (desktop + mobile), the
 * global success toast, and the scrollable main-content area.
 *
 * Only the sidebar (`h-screen`, sticky) and the main content area
 * (`overflow-y-auto`) scroll independently — the header stays put.
 */
export default function OnboardingLayout({
  headerSub,
  pct,
  displayIndex,
  totalSteps,
  isLast,
  sidebarProps,
  mobileMenuOpen,
  onMobileMenuOpen,
  onMobileMenuClose,
  toastMessage,
  clearToast,
  children,
}) {
  return (
    <div
      className="h-screen bg-white relative overflow-hidden flex flex-col lg:flex-row"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Global success toast — top-level, never remounts on step change */}
      <SuccessToast message={toastMessage} onDismiss={clearToast} />

      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom left,rgba(16,185,129,0.13) 0%,transparent 70%)", zIndex: 0 }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right,rgba(99,102,241,0.06) 0%,transparent 70%)", zIndex: 0 }} />

      <div className="hidden lg:block relative flex-shrink-0" style={{ zIndex: 1 }}>
        <Sidebar {...sidebarProps} />
      </div>

      <MobileSidebarDrawer open={mobileMenuOpen} onClose={onMobileMenuClose}>
        <Sidebar {...sidebarProps} />
      </MobileSidebarDrawer>

      <div className="relative flex flex-col flex-1 min-w-0 min-h-0 h-screen" style={{ zIndex: 1 }}>

        <MobileHeader
          title="Vendor Onboarding"
          sub={headerSub}
          onMenuOpen={onMobileMenuOpen}
          pct={pct}
          displayIndex={displayIndex}
          totalSteps={totalSteps}
          isLast={isLast}
        />

        <header className="hidden lg:flex px-8 py-2 items-center justify-between
          border-b border-gray-100 bg-white flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Vendor Onboarding</h1>
              <p className="text-xs text-gray-400 mt-0.5">{headerSub}</p>
            </div>
          </div>

          {!isLast && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600">Step {displayIndex} of {totalSteps}</p>
                <p className="text-[10px] text-gray-400">{pct}% Complete</p>
              </div>
              <div className="relative w-9 h-9 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${pct * 0.942} ${94.2 - pct * 0.942}`} strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center
                  text-[10px] font-black text-emerald-600">
                  {pct}%
                </span>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col min-h-0 py-2 px-4 sm:py-3 sm:px-6 lg:px-8 bg-[#F8FAF7] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
