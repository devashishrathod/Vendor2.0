import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CircleCheck,
  CircleX,
  FileText,
  History,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react';
import { formatCurrencyINR, formatDateDMY, formatDateLong } from '../utils/formatters';
import { HISTORY_ACTION_LABELS, HISTORY_PERFORMER_LABELS } from '../constants/subscription.constants';

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const capitalize = (name = '') => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

// Icon + colour per kind of event (actions vary, so they're matched loosely).
const KINDS = [
  { test: /CANCEL|REVOK|EXPIR/, icon: CircleX, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  { test: /DOWNGRADE/, icon: ArrowDownRight, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  { test: /UPGRADE/, icon: ArrowUpRight, tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  { test: /SCHEDULE/, icon: CalendarClock, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  { test: /RENEW/, icon: RefreshCw, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { test: /ACTIV|GRANT/, icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { test: /ORDER|PURCHASE/, icon: ShoppingCart, tone: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { test: /TERMS/, icon: FileText, tone: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
];
const DEFAULT_KIND = { icon: History, tone: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
const kindOf = (action) => KINDS.find((k) => k.test.test(String(action || '').toUpperCase())) || DEFAULT_KIND;

/**
 * Purchase history as a timeline — GET /subscribeds/history mapped by
 * mapHistoryRow (subscriptionService). Each entry shows only the facts its
 * record carries. Rows have no transaction, so "View invoice" is offered
 * only on entries of the current subscription (`invoiceSubscriptionId`).
 */
export default function PurchaseHistoryList({ entries, invoiceSubscriptionId, onViewInvoice }) {
  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <History size={22} className="text-gray-300" aria-hidden="true" />
        <p className="text-sm text-gray-500">No purchase history yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-2.5">
      {entries.map((row, i) => {
        const { icon: Icon, tone } = kindOf(row.action);
        const actionLabel = HISTORY_ACTION_LABELS[row.action] || titleCase(row.action);
        const byLabel = row.by || HISTORY_PERFORMER_LABELS[row.byRole] || (row.byRole ? titleCase(row.byRole) : '');
        const canViewInvoice = onViewInvoice && invoiceSubscriptionId && row.subscribedId === invoiceSubscriptionId;

        const facts = [
          (row.startDate || row.endDate) && `${formatDateDMY(row.startDate)} → ${formatDateDMY(row.endDate)}`,
          row.amount != null && (row.isFree ? `${formatCurrencyINR(row.amount)} · Free` : formatCurrencyINR(row.amount)),
          byLabel && `by ${byLabel}`,
        ].filter(Boolean);

        return (
          <li key={row.id} className="relative flex gap-3">
            {i < entries.length - 1 && (
              <span className="absolute left-[17px] top-10 bottom-[-10px] w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
            )}
            <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon size={16} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-gray-900/40">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-bold text-gray-900 dark:text-gray-50">
                  {actionLabel}
                  {row.toPlanName && (
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      ·{' '}
                      {row.fromPlanName && (
                        <>
                          {capitalize(row.fromPlanName)} <span className="text-gray-400">→</span>{' '}
                        </>
                      )}
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{capitalize(row.toPlanName)}</span>
                    </span>
                  )}
                  {row.isTrial && (
                    <span className="rounded-full bg-sky-100 px-1.5 py-px text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                      Trial
                    </span>
                  )}
                </p>
                <time className="shrink-0 text-[11px] text-gray-400" dateTime={row.createdAt}>
                  {formatDateLong(row.createdAt)}
                </time>
              </div>

              {facts.length > 0 && (
                <p className="mt-1 text-[12px] text-gray-600 dark:text-gray-300">{facts.join('  ·  ')}</p>
              )}

              {row.reason && (
                <p className="mt-1 line-clamp-2 text-[11.5px] text-gray-500 dark:text-gray-400" title={row.reason}>
                  {row.reason}
                </p>
              )}

              {row.forfeitedDays > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-amber-700 dark:text-amber-400">
                  <TriangleAlert size={12} className="shrink-0" aria-hidden="true" />
                  {row.forfeitedDays} days of the previous plan forfeited ({formatCurrencyINR(row.forfeitedValue)})
                </p>
              )}

              {canViewInvoice && (
                <button
                  type="button"
                  onClick={() => onViewInvoice()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-400 dark:ring-emerald-500/30"
                >
                  <Receipt size={13} aria-hidden="true" />
                  View invoice
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
