import { BellOff, Check, Clock, X } from "lucide-react";

import { getNotificationVisual } from "../constants/notificationTypes";

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

function formatFullDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Pulsing placeholder cards shown while notifications load. */
export function NotificationSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-start gap-3 rounded-xl p-3">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700" />
          <span className="flex-1 space-y-2 pt-1">
            <span className="block h-3 w-2/3 rounded-full bg-gray-100 dark:bg-gray-700" />
            <span className="block h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700" />
            <span className="block h-2.5 w-1/3 rounded-full bg-gray-100 dark:bg-gray-700" />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Friendly empty state for the dropdown and drawer. */
export function NotificationEmpty({ title = "No notifications yet", subtitle = "New updates about your vouchers and payments will show up here." }) {
  return (
    <div className="flex animate-fade-in flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
        <BellOff size={24} />
      </span>
      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="max-w-[16rem] text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

const STAGGER_MS = 40;
const MAX_STAGGER_MS = 320;

/**
 * One notification card, shared by the bell's preview dropdown and the
 * "View all" drawer: type icon (unread dot on its corner), title, 2-line
 * body, relative time. Mark-as-read / clear float in on hover (always
 * visible on touch screens, which have no hover). `index` staggers the
 * entrance animation.
 */
export default function NotificationItem({ notification: n, index = 0, onOpen, onMarkRead, onClear }) {
  const { icon: Icon, tint, card } = getNotificationVisual(n);

  return (
    <div
      className={`group relative animate-fade-up rounded-xl transition-colors duration-200 ${
        !n.isRead ? card.unread : card.read
      }`}
      style={{ animationDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
    >
      <button type="button" onClick={() => onOpen(n)} className="flex w-full items-start gap-3 p-3 text-left">
        <span
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${tint}`}
        >
          <Icon size={18} strokeWidth={2} />
          {!n.isRead && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[13px] ${
              !n.isRead ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-200"
            }`}
          >
            {n.title}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {n.body}
          </span>
          <span className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-gray-400" title={formatFullDate(n.createdAt)}>
            <Clock size={10} />
            {timeAgo(n.createdAt)}
          </span>
        </span>
      </button>

      <div className="absolute right-2 top-2 flex items-center gap-1 transition-all duration-200 sm:pointer-events-none sm:translate-x-1 sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
        {!n.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(n._id)}
            title="Mark as read"
            aria-label="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-emerald-500 hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-emerald-500 dark:hover:text-white"
          >
            <Check size={13} strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onClear(n._id)}
          title="Clear"
          aria-label="Clear notification"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-rose-500 hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-rose-500 dark:hover:text-white"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
