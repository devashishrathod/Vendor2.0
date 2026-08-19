import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useLogout } from "@/hooks/useLogout";
import logo from "@/assets/Logo1.jpg";

const NAV_TABS = [
  { label: "Analysis Report", to: "/analysis-report" },
  { label: "Transactions",    to: "/transactions"        },
  { label: "Settlements",     to: "/settlements"      },
  { label: "Voucher",         to: "/vouchers"          },
  { label: "Account Information ",       to: "/account-information"        },
  { label: "Sub Outlets & Franchise",      to: "/outlets"       },
  { label: "Subscription Plan",      to: "/subscription-plan"       },
  // { label: "Playlist Music",      to: "/music"       },
  // { label: "More",            to: "/more"             },
];

const MENU_ANIM_MS = 220;

export default function DashboardHeader() {
  const { handleLogout } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);   // logical open/closed
  const [menuMounted, setMenuMounted] = useState(false); // kept in DOM during close animation
  const [menuVisible, setMenuVisible] = useState(false); // drives the transition classes
  const closeTimer = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setMenuOpen(true);
    setMenuMounted(true);
    // next tick so the browser registers the "closed" starting styles first
    requestAnimationFrame(() => requestAnimationFrame(() => setMenuVisible(true)));
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuVisible(false);
    closeTimer.current = setTimeout(() => setMenuMounted(false), MENU_ANIM_MS);
  };

  const toggleMenu = () => (menuOpen ? closeMenu() : openMenu());

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 relative">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* ── Left: Logo + Nav links ── */}
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Trydood"
            className="w-10 h-10 object-contain flex-shrink-0"
          />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_TABS.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 whitespace-nowrap
                  ${isActive
                    ? "text-emerald-600 font-semibold bg-emerald-50"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* ── Right: Logout + Avatar + Hamburger ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500
              px-3 py-1.5 rounded-lg border border-transparent
              hover:bg-red-50 hover:border-red-100 transition-all duration-150"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>

          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setProfileOpen((prev) => !prev)}
              className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            {/* Profile dropdown - desktop only */}
            <div
              className={`hidden sm:block absolute right-0 top-full mt-2 w-44 origin-top-right
                bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50
                transition-all duration-150 ease-out
                ${profileOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }`}
            >
              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </button>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-150"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Hamburger button - visible below lg breakpoint, bars morph into an X */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="lg:hidden relative flex items-center justify-center w-9 h-9 rounded-md
              text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150"
          >
            <span className="relative block w-[18px] h-[14px]">
              <span
                className={`absolute left-0 top-0 w-full h-[2px] rounded-full bg-current transition-all duration-200 ease-out
                  ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] rounded-full bg-current transition-all duration-150 ease-out
                  ${menuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"}`}
              />
              <span
                className={`absolute left-0 bottom-0 w-full h-[2px] rounded-full bg-current transition-all duration-200 ease-out
                  ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

      </div>

      {/* ── Mobile dropdown menu — laptop-lid style open/close ── */}
      {menuMounted && (
        <div
          className="lg:hidden absolute top-full left-0 w-full z-50 overflow-visible"
          style={{ perspective: "1200px" }}
        >
          <div
            className={`origin-top border-t border-gray-100 bg-white/95 backdrop-blur-sm
              px-4 py-2 flex flex-col gap-0.5 shadow-2xl
              transition-all ease-[cubic-bezier(0.22,1,0.36,1)]
              ${menuVisible
                ? "opacity-100 duration-300"
                : "opacity-0 duration-200"
              }`}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transform: menuVisible ? "rotateX(0deg)" : "rotateX(-100deg)",
            }}
          >
            {NAV_TABS.map(({ label, to }, i) => (
              <NavLink
                key={label}
                to={to}
                onClick={closeMenu}
                style={{ transitionDelay: menuVisible ? `${100 + i * 30}ms` : "0ms" }}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out
                  ${menuVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                  ${isActive
                    ? "text-emerald-600 font-semibold bg-emerald-50"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {/* Logout also shown here for small screens where it's hidden in the top bar */}
            <button
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              style={{ transitionDelay: menuVisible ? `${100 + NAV_TABS.length * 30}ms` : "0ms" }}
              className={`sm:hidden flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500
                px-3 py-2 rounded-md hover:bg-red-50 transition-all duration-200 ease-out mt-1
                ${menuVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}