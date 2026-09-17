import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLogout } from "@/hooks/useLogout";
import { useBrand } from "@/hooks/useBrand";
import logo from "@/assets/Logo1.jpg";
import NotificationBell from "./NotificationBell";

const NAV_TABS = [
  { label: "Analysis Report", to: "/analysis-report" },
  { label: "Transactions",    to: "/transactions"        },
  { label: "Settlements",     to: "/settlements"      },
  { label: "Voucher",         to: "/vouchers"          },
  // { label: "Account Information",       to: "/account-information"        },
  // { label: "Sub Outlets & Franchise",      to: "/outlets"       },
  // { label: "Subscription Plan",      to: "/subscription-plan"       },
  // { label: "Playlist Music",      to: "/music"       },
  // { label: "More",            to: "/more"             },
];

const MENU_ANIM_MS = 220;

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { handleLogout } = useLogout();
  const { brand } = useBrand();
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
    <nav className="bg-white/85 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 relative">
      <div className="px-4 sm:px-6 h-16 flex items-center">

        {/* ── Left: Logo ── */}
        <div className="flex items-center gap-4 flex-1">
          {/* Logo1.jpg is a full vertical lockup (icon, then "TRYDOOD" wordmark,
              then a tagline) — squeezing the whole thing into a small square
              made it illegible, so this crops in on just the icon mark
              (a fixed pixel window into the source image, scaled up) and
              pairs it with real "Trydood" text instead. */}
          <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white ring-1 ring-gray-100">
            <img
              src={logo}
              alt=""
              className="absolute"
              style={{ width: "105px", height: "75px", top: "-2.25px", left: "-34px", maxWidth: "none" }}
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-bold text-gray-900 tracking-tight">Trydood</p>
            <p className="text-[10px] text-gray-400 -mt-0.5">Vendor Panel</p>
          </div>
        </div>

        {/* ── Center: Desktop nav links — a segmented-pill track, flex-1 on
            both sides above/below keeps this centered on the header's full
            width regardless of how wide the logo or the right-side icons
            are. ── */}
        <div className="hidden lg:flex items-center justify-center gap-0.5 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-full p-1">
          {NAV_TABS.map(({ label, to }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap
                ${isActive
                  ? "text-emerald-600 font-semibold bg-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Right: Notifications + Avatar + Hamburger ── */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <NotificationBell />

          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setProfileOpen((prev) => !prev)}
              className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm shadow-emerald-100 ring-1 ring-emerald-100 hover:shadow-emerald-200 transition-shadow duration-150 bg-gradient-to-br from-emerald-500 to-emerald-700"
            >
              {brand?.logo ? (
                <img src={brand.logo} alt={brand.brandName || "Brand logo"} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>

            {/* Profile dropdown - now the single Logout entry point on every breakpoint */}
            <div
              className={`absolute right-0 top-full mt-2.5 w-64 origin-top-right
                bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50
                transition-all duration-150 ease-out
                ${profileOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }`}
            >
              {/* Mini identity header — same brand logo as the trigger avatar. */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-emerald-50/70 to-white border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm shadow-emerald-100 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  {brand?.logo ? (
                    <img src={brand.logo} alt={brand.brandName || "Brand logo"} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate capitalize">{brand?.brandName || "Your Brand"}</p>
                  <p className="text-[11px] text-gray-400 truncate">{brand?.merchantId ? `ID: ${brand.merchantId}` : "Vendor Panel"}</p>
                </div>
              </div>

              <div className="p-1.5 flex flex-col gap-0.5">
                {/* Who am I — account identity first. */}
                <NavLink to="/account-information" onClick={() => setProfileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150
                    ${isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
                  }
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                  Brand Information
                </NavLink>

                {/* What I run — my outlets/sub-brands next. */}
                <NavLink to="/outlets" onClick={() => setProfileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150
                    ${isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
                  }
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-6 0h6"
                      />
                    </svg>
                  </span>
                  Outlet's & franchise
                </NavLink>

                {/* What I pay for. */}
                <NavLink to="/subscription-plan" onClick={() => setProfileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150
                    ${isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
                  }
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  My Subscription's
                </NavLink>

                {/* App configuration, last before sign-out. */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  Settings
                </button>
              </div>

              <div className="border-t border-gray-100" />

              <div className="p-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-150"
                >
                  <span className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </span>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Hamburger button - visible below lg breakpoint, bars morph into an X */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="lg:hidden relative flex items-center justify-center w-9 h-9 rounded-xl
              text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-150"
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
            className={`origin-top border-t border-gray-100 bg-white/95 backdrop-blur-md
              px-4 py-3 flex flex-col gap-1 shadow-2xl
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
                  `px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out
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
          </div>
        </div>
      )}
    </nav>
  );
}