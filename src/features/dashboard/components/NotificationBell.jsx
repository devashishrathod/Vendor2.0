import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, CheckCheck, Trash2 } from "lucide-react";

import ConfirmModal from "@/components/common/ConfirmModal";

import useNotifications from "../hooks/useNotifications";
import NotificationDrawer from "./NotificationDrawer";
import NotificationItem, { NotificationEmpty, NotificationSkeleton } from "./NotificationItem";

const PREVIEW_COUNT = 5;

// Header bell — a short preview dropdown (latest few, with Mark as read /
// Clear per item, Mark all read, Clear all) plus a "View all" right-side
// drawer with the full list. Both share one useNotifications() state.
// Fetched once on mount (not just on open) so the unread dot on the bell
// itself is accurate before the vendor ever clicks it. Opening the
// dropdown no longer auto-marks everything read — that's now an explicit
// action.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  const {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    actionError,
    loadMore,
    markRead,
    markAllRead,
    remove,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Clicking a notification (in the dropdown or the drawer) marks it read
  // and opens its full details in the drawer. Its link (confirmed key:
  // meta.deepLink) is followed from the detail view's buttons instead.
  const handleOpenItem = useCallback(
    (n) => {
      if (!n.isRead) markRead(n._id);
      setSelectedId(n._id);
      setOpen(false);
      setDrawerOpen(true);
    },
    [markRead]
  );

  const handleNavigate = useCallback(
    (path) => {
      setOpen(false);
      setDrawerOpen(false);
      setSelectedId(null);
      navigate(path);
    },
    [navigate]
  );

  const handleClear = useCallback(
    (id) => {
      if (id === selectedId) setSelectedId(null);
      remove(id);
    },
    [remove, selectedId]
  );

  const openDrawer = useCallback(() => {
    setOpen(false);
    setSelectedId(null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedId(null);
  }, []);

  const backToList = useCallback(() => setSelectedId(null), []);

  const requestClearAll = useCallback(() => setConfirmClearAll(true), []);

  const previewItems = items.slice(0, PREVIEW_COUNT);
  const visibleError = actionError || error;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
          aria-expanded={open}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 ${
            open
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
          }`}
        >
          {/* Rings once whenever the unread count changes (key remounts it). */}
          <Bell key={unreadCount} size={18} className={unreadCount > 0 ? "origin-top animate-bell-ring" : ""} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-3 flex w-[24rem] max-w-[calc(100vw-2rem)] origin-top-right animate-pop-in flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl shadow-gray-900/10 backdrop-blur-xl dark:bg-gray-800/95 dark:shadow-black/40">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30">
                  <Bell size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</p>
                  <p className="text-[11px] text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>

            {visibleError && (
              <p className="mx-4 mb-1 animate-fade-in rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                {visibleError}
              </p>
            )}

            {/* Preview list */}
            <div className="no-scrollbar max-h-[22rem] overflow-y-auto px-2 py-1">
              {loading ? (
                <NotificationSkeleton />
              ) : previewItems.length === 0 ? (
                <NotificationEmpty />
              ) : (
                <div className="space-y-1">
                  {previewItems.map((n, i) => (
                    <NotificationItem
                      key={n._id}
                      notification={n}
                      index={i}
                      onOpen={handleOpenItem}
                      onMarkRead={markRead}
                      onClear={handleClear}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-2">
              <button
                type="button"
                onClick={requestClearAll}
                disabled={items.length === 0}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:text-gray-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
              >
                <Trash2 size={14} />
                Clear all
              </button>
              <button
                type="button"
                onClick={openDrawer}
                className="group/view ml-auto flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-emerald-500 dark:hover:text-white"
              >
                View all
                <ArrowRight size={14} className="transition-transform duration-200 group-hover/view:translate-x-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        selectedId={selectedId}
        onBack={backToList}
        onNavigate={handleNavigate}
        items={items}
        unreadCount={unreadCount}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={visibleError}
        onLoadMore={loadMore}
        onOpenItem={handleOpenItem}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onClear={handleClear}
        onClearAll={requestClearAll}
      />

      {confirmClearAll &&
        createPortal(
          <ConfirmModal
            title="Clear all notifications?"
            description="This removes every notification from your list. This can't be undone."
            onConfirm={() => {
              setConfirmClearAll(false);
              clearAll();
            }}
            onCancel={() => setConfirmClearAll(false)}
          />,
          document.body
        )}
    </>
  );
}
