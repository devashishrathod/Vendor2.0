import { History, LoaderCircle, X } from 'lucide-react';
import Modal from './Modal';
import PurchaseHistoryList from './PurchaseHistoryList';
import { useInvoiceHistory } from '../hooks/useInvoiceHistory';

/** Purchase history from GET /subscribeds/history, fetched when opened. */
export default function InvoiceHistoryModal({ open, onClose, invoiceSubscriptionId, onViewInvoice }) {
  const { invoices, total, isLoading, error, refetch } = useInvoiceHistory({ enabled: open });

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Purchase history" widthVariant="invoice">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <History size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-gray-900 dark:text-gray-50">Purchase history</p>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading…' : `${total} ${total === 1 ? 'record' : 'records'} · newest first`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        {isLoading && (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Loading purchase history…
          </p>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <PurchaseHistoryList
            entries={invoices}
            invoiceSubscriptionId={invoiceSubscriptionId}
            onViewInvoice={onViewInvoice}
          />
        )}
      </div>
    </Modal>
  );
}
