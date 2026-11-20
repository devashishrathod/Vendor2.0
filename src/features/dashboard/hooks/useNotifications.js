import { useCallback, useEffect, useRef, useState } from "react";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/notificationApi";
import { NOTIFICATION_EVENT, refreshProfileAfterNotice } from "@/utils/notificationEvents";
import { refreshesProfile } from "@/utils/notificationLinks";

const PAGE_SIZE = 20;

/**
 * Shared notification state for the header bell's preview dropdown and the
 * "View all" drawer, so both always show the same list. The unread badge is
 * the server's `unreadCount` (GET get-all and every mark-read response, API
 * doc #18 / #19), never a count of the pages loaded so far. A push that
 * arrives (NOTIFICATION_EVENT) reloads the first page. Actions are
 * optimistic: the UI updates immediately, and if the request fails the
 * previous list is restored and `actionError` is set.
 */
export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // First page + the server's unread count. State is only set once it settles.
  const reload = useCallback(
    () =>
      getNotifications({ page: 1, limit: PAGE_SIZE })
        .then((res) => {
          const nextItems = res?.data?.data ?? [];
          setItems(nextItems);
          itemsRef.current = nextItems;
          setUnreadCount(res?.data?.unreadCount ?? nextItems.filter((item) => !item.isRead).length);
          setTotalPages(res?.data?.totalPages ?? 1);
          setPage(1);
          setError("");
        })
        .catch((err) => {
          console.error("Notifications fetch failed:", err);
          setError(err.message || "Failed to load notifications.");
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
    window.addEventListener(NOTIFICATION_EVENT, reload);
    return () => window.removeEventListener(NOTIFICATION_EVENT, reload);
  }, [reload]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    try {
      setLoadingMore(true);
      const next = page + 1;
      const res = await getNotifications({ page: next, limit: PAGE_SIZE });
      const more = res?.data?.data ?? [];
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item._id));
        const updated = [...prev, ...more.filter((item) => !seen.has(item._id))];
        itemsRef.current = updated;
        return updated;
      });
      if (typeof res?.data?.unreadCount === "number") setUnreadCount(res.data.unreadCount);
      setPage(next);
      setTotalPages(res?.data?.totalPages ?? next);
    } catch (err) {
      console.error("Load more notifications failed:", err);
      setActionError(err.message || "Failed to load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  // Optimistic list + count; the response's fresh `unreadCount` wins.
  const runOptimistic = useCallback(async (update, nextCount, request, failMessage) => {
    const snapshot = itemsRef.current;
    let countSnapshot = 0;
    setUnreadCount((c) => {
      countSnapshot = c;
      return nextCount(c);
    });
    const next = update(snapshot);
    itemsRef.current = next;
    setItems(next);
    setActionError("");
    try {
      const res = await request();
      if (typeof res?.data?.unreadCount === "number") setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(failMessage, err);
      itemsRef.current = snapshot;
      setItems(snapshot);
      setUnreadCount(countSnapshot);
      setActionError(err.message || failMessage);
    }
  }, []);

  const markRead = useCallback(
    (id) => {
      const target = itemsRef.current.find((item) => item._id === id);
      // Opening a review / legal / outlet notice → the panel re-reads what it changed.
      if (refreshesProfile(target?.type)) refreshProfileAfterNotice();
      if (!target || target.isRead) return Promise.resolve();
      return runOptimistic(
        (prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
        (c) => Math.max(0, c - 1),
        () => markNotificationRead(id),
        "Failed to mark notification as read.",
      );
    },
    [runOptimistic],
  );

  const markAllRead = useCallback(
    () =>
      runOptimistic(
        (prev) => prev.map((item) => ({ ...item, isRead: true })),
        () => 0,
        () => markAllNotificationsRead(),
        "Failed to mark notifications as read.",
      ),
    [runOptimistic],
  );

  return {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore: page < totalPages,
    error,
    actionError,
    dismissActionError: () => setActionError(""),
    reload,
    loadMore,
    markRead,
    markAllRead,
  };
}
