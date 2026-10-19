import {
  AlertTriangle,
  Bell,
  Crown,
  RotateCcw,
  Store,
  Ticket,
  TicketPercent,
  Wallet,
} from "lucide-react";

// Icon + colours per notification category. `tint` is the icon tile;
// `card.unread` / `card.read` are the whole card's background (unread a
// touch stronger). Class strings are written out in full so Tailwind can
// see them. Confirmed type so far: REFUND_REQUESTED — the rest are matched
// by keyword in `type` (e.g. any REFUND_* / *CLAIM* type), so new backend
// types still get a sensible look instead of needing an exact list.
const CATEGORIES = [
  {
    match: /REFUND/,
    icon: RotateCcw,
    tint: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    card: {
      unread: "bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-500/10 dark:hover:bg-amber-500/15",
      read: "bg-amber-50/40 hover:bg-amber-50 dark:bg-amber-500/[0.04] dark:hover:bg-amber-500/10",
    },
  },
  {
    match: /CLAIM|REDEEM/,
    icon: Ticket,
    tint: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    card: {
      unread: "bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15",
      read: "bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/10",
    },
  },
  {
    match: /PAYMENT|SETTLEMENT|PAYOUT/,
    icon: Wallet,
    tint: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
    card: {
      unread: "bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-500/10 dark:hover:bg-sky-500/15",
      read: "bg-sky-50/40 hover:bg-sky-50 dark:bg-sky-500/[0.04] dark:hover:bg-sky-500/10",
    },
  },
  {
    match: /VOUCHER/,
    icon: TicketPercent,
    tint: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    card: {
      unread: "bg-violet-50 hover:bg-violet-100/70 dark:bg-violet-500/10 dark:hover:bg-violet-500/15",
      read: "bg-violet-50/40 hover:bg-violet-50 dark:bg-violet-500/[0.04] dark:hover:bg-violet-500/10",
    },
  },
  {
    match: /SUBSCRIPTION|PLAN/,
    icon: Crown,
    tint: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400",
    card: {
      unread: "bg-fuchsia-50 hover:bg-fuchsia-100/70 dark:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/15",
      read: "bg-fuchsia-50/40 hover:bg-fuchsia-50 dark:bg-fuchsia-500/[0.04] dark:hover:bg-fuchsia-500/10",
    },
  },
  {
    match: /OUTLET|SUB_BRAND|BRAND/,
    icon: Store,
    tint: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
    card: {
      unread: "bg-teal-50 hover:bg-teal-100/70 dark:bg-teal-500/10 dark:hover:bg-teal-500/15",
      read: "bg-teal-50/40 hover:bg-teal-50 dark:bg-teal-500/[0.04] dark:hover:bg-teal-500/10",
    },
  },
];

const ALERT = {
  icon: AlertTriangle,
  tint: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  card: {
    unread: "bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-500/10 dark:hover:bg-rose-500/15",
    read: "bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-500/[0.04] dark:hover:bg-rose-500/10",
  },
};

const DEFAULT = {
  icon: Bell,
  tint: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
  card: {
    unread: "bg-gray-100/80 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700/70",
    read: "bg-gray-50/60 hover:bg-gray-100 dark:bg-gray-700/20 dark:hover:bg-gray-700/50",
  },
};

/**
 * @param {{ type?: string, severity?: string }} notification
 * @returns {{ icon: import("react").ComponentType, tint: string, card: { unread: string, read: string } }}
 */
export function getNotificationVisual(notification) {
  const type = String(notification?.type || "").toUpperCase();
  const category = CATEGORIES.find((c) => c.match.test(type));
  if (category) return category;
  if (["ERROR", "CRITICAL"].includes(notification?.severity)) return ALERT;
  return DEFAULT;
}
