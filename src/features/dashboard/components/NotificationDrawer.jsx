import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, ChevronDown, Loader2, Trash2, X } from "lucide-react";

import NotificationDetail from "./NotificationDetail";
import NotificationItem, { NotificationEmpty, NotificationSkeleton } from "./NotificationItem";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

/**
 * Right-side "View all" panel — the full notification list with All/Unread
 * tabs, Mark all read, Clear all, per-item actions and Load more. When
 * `selectedId` is set it shows that notification's full details instead
 * (NotificationDetail), with a back link to the list. Portaled to <body> so
 * the header's own stacking/overflow can't clip it.
 */
export default function NotificationDrawer({
  open,
  onClose,
  selectedId,
  onBack,
  onNavigate,
  items,
  unreadCount,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onOpenItem,
  onMarkRead,
  onMarkAllRead,
  onClear,
  onClearAll,
}) {
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const visibleItems = useMemo(
    () => (tab === "unread" ? items.filter((n) => !n.isRead) : items),
    [items, tab]
  );

  if (!open) return null;

  const selected = selectedId ? items.find((n) => n._id === selectedId) : null;

  const listView = (
    <>
      {/* Tabs + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700/60">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
              }`}
            >
              {t.label}
              {t.key === "unread" && unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 py-px text-[10px] font-bold text-white">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            title="Mark all as read"
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-500/15"
          >
            <CheckCheck size={15} />
            Read all
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={items.length === 0}
            title="Clear all notifications"
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-rose-400 dark:hover:bg-rose-500/15"
          >
            <Trash2 size={15} />
            Clear all
          </button>
        </div>
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <NotificationSkeleton rows={5} />
        ) : visibleItems.length === 0 ? (
          <NotificationEmpty
            title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
            subtitle={tab === "unread" ? "You've read everything — nice!" : undefined}
          />
        ) : (
          <div key={tab} className="space-y-1">
            {visibleItems.map((n, i) => (
              <NotificationItem
                key={n._id}
                notification={n}
                index={i}
                onOpen={onOpenItem}
                onMarkRead={onMarkRead}
                onClear={onClear}
              />
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="All notifications"
        className="relative flex h-full w-full max-w-md animate-slide-in-right flex-col bg-white shadow-2xl dark:bg-gray-800 sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <Bell size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
              <p className="text-xs text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:rotate-90 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <p className="mx-5 mb-2 animate-fade-in rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}

        {selected ? (
          <NotificationDetail notification={selected} onBack={onBack} onNavigate={onNavigate} onClear={onClear} />
        ) : (
          listView
        )}
      </aside>
    </div>,
    document.body
  );
}
