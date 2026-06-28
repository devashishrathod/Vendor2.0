import { NavLink } from "react-router-dom";
import { useLogout } from "@/hooks/useLogout";
import logo from "@/assets/Logo1.jpg";

const NAV_TABS = [
  { label: "Analysis Report", to: "/analysis-report" },
  { label: "Transactions",    to: "/dashboard"        },
  { label: "Settlements",     to: "/settlements"      },
  { label: "Voucher",         to: "/voucher"          },
  { label: "Deal Pack",       to: "/deal-pack"        },
  { label: "Membership",      to: "/membership"       },
  { label: "More",            to: "/more"             },
];

export default function DashboardHeader() {
  const { handleLogout } = useLogout();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="px-6 h-14 flex items-center justify-between">

        {/* ── Left: Logo + Nav links ── */}
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Trydood"
            className="w-10 h-10 object-contain flex-shrink-0"
          />

          <div className="hidden sm:flex items-center gap-0.5">
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

        {/* ── Right: Logout + Avatar ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500
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

          <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

      </div>
    </nav>
  );
}