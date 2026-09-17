import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/services/api/notificationApi";

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Header bell — dropdown backed by the real GET /notifications/get-all
// endpoint. Fetched once on mount (not just on open) so the unread dot on
// the bell itself is accurate before the vendor ever clicks it.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    getNotifications({ page: 1, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setNotifications(res?.data?.data ?? []);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load notifications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Opening the dropdown marks everything read (server-side, via the real
  // PUT /notifications/mark-read) — before this, nothing ever cleared the
  // unread badge, so it stayed stuck showing "new" forever.
  const handleToggle = () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      markAllNotificationsRead().catch((err) => {
        console.error("Failed to mark notifications read:", err.message);
      });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors duration-150"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{unreadCount} new</span>
            )}
          </div>

          {loading ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">Loading…</p>
          ) : error ? (
            <p className="px-4 py-6 text-center text-xs text-rose-500">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => {
                  setOpen(false);
                  if (n.meta?.deeplink) navigate(n.meta.deeplink);
                }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !n.isRead ? "bg-emerald-50/40 dark:bg-emerald-500/10" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
