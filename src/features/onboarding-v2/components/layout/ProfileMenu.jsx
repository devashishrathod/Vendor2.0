import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/features/onboarding/store/authStore";

/**
 * Profile button in the onboarding header. Click opens a small dropdown
 * with the signed-in number (when known) and Logout. Closes on outside
 * click and Escape.
 */
export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { handleLogout } = useLogout();
  const user = useAuthStore((s) => s.user);
  const phone = user?.whatsappNumber || user?.mobile || user?.phone || "";

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex h-10 items-center gap-1 rounded-full pl-0.5 pr-2 ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
          open
            ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30"
            : "bg-white ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800"
        }`}
      >
        <span className="grid size-9 place-items-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <User size={17} strokeWidth={2} aria-hidden="true" />
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-40 mt-2 w-52 animate-fade-in overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)] ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
        >
          {phone && (
            <div className="border-b border-gray-100 px-3.5 py-2.5 dark:border-gray-800">
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
              <p className="truncate text-[13px] font-bold text-gray-900 dark:text-gray-100">{phone}</p>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10"
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
