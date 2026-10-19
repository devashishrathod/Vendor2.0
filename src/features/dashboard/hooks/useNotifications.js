import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api/notificationApi";

const PAGE_SIZE = 20;

/**
 * Shared notification state for the header bell's preview dropdown and the
 * "View all" drawer, so both always show the same list. Every action is
 * optimistic: the UI updates immediately, and if the request fails the
 * previous list is restored and `actionError` is set.
 */
export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  // Latest list for optimistic updates to snapshot/roll back from — kept in
  // sync with `items` so a fast failure never restores a stale list.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    getNotifications({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setItems(res?.data?.data ?? []);
        setTotalPages(res?.data?.totalPages ?? 1);
        setPage(1);
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

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    try {
      setLoadingMore(true);
      const next = page + 1;
      const res = await getNotifications({ page: next, limit: PAGE_SIZE });
      const more = res?.data?.data ?? [];
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n._id));
        return [...prev, ...more.filter((n) => !seen.has(n._id))];
      });
      setPage(next);
      setTotalPages(res?.data?.totalPages ?? next);
    } catch (err) {
      console.error("Load more notifications failed:", err);
      setActionError(err.message || "Failed to load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  // Applies `update` to the list right away, then rolls it back if `request`
  // fails.
  const runOptimistic = useCallback(async (update, request, failMessage) => {
    const snapshot = itemsRef.current;
    const next = update(snapshot);
    itemsRef.current = next;
    setItems(next);
    setActionError("");
    try {
      await request();
    } catch (err) {
      console.error(failMessage, err);
      itemsRef.current = snapshot;
      setItems(snapshot);
      setActionError(err.message || failMessage);
    }
  }, []);

  const markRead = useCallback(
    (id) =>
      runOptimistic(
        (prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        () => markNotificationRead(id),
        "Failed to mark notification as read."
      ),
    [runOptimistic]
  );

  const markAllRead = useCallback(
    () =>
      runOptimistic(
        (prev) => prev.map((n) => ({ ...n, isRead: true })),
        () => markAllNotificationsRead(),
        "Failed to mark notifications as read."
      ),
    [runOptimistic]
  );

  const remove = useCallback(
    (id) =>
      runOptimistic(
        (prev) => prev.filter((n) => n._id !== id),
        () => deleteNotification(id),
        "Failed to clear notification."
      ),
    [runOptimistic]
  );

  const clearAll = useCallback(async () => {
    await runOptimistic(
      () => [],
      () => clearAllNotifications(),
      "Failed to clear notifications."
    );
    setPage(1);
    setTotalPages(1);
  }, [runOptimistic]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  return {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore: page < totalPages,
    error,
    actionError,
    dismissActionError: () => setActionError(""),
    loadMore,
    markRead,
    markAllRead,
    remove,
    clearAll,
  };
}
