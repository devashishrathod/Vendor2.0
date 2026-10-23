import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  clearAllNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api/notificationApi";

const PAGE_SIZE = 20;

/**
 * Shared notification state for the header bell's preview dropdown and the
 * "View all" drawer, so both always show the same list. Actions are
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
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    getNotifications({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        const nextItems = res?.data?.data ?? [];
        setItems(nextItems);
        itemsRef.current = nextItems;
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
        const seen = new Set(prev.map((item) => item._id));
        const updated = [...prev, ...more.filter((item) => !seen.has(item._id))];
        itemsRef.current = updated;
        return updated;
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
    (id) => runOptimistic(
      (prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
      () => markNotificationRead(id),
      "Failed to mark notification as read."
    ),
    [runOptimistic]
  );

  const markAllRead = useCallback(
    () => runOptimistic(
      (prev) => prev.map((item) => ({ ...item, isRead: true })),
      () => markAllNotificationsRead(),
      "Failed to mark notifications as read."
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

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

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
    clearAll,
  };
}
