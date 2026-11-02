import { Download, LoaderCircle, Printer, Receipt, X } from 'lucide-react';
import Modal from './Modal';
import { useInvoice } from '../hooks/useInvoice';
import InvoiceCard from './InvoiceCard';

const iconBtn =
  'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100';

/**
 * Compact tax-invoice modal. `invoice` is subscription.invoice (from
 * /subscribeds/get); the invoice number + PDF are fetched when it opens.
 * If that fails the invoice still shows, with a retry for the number.
 */
export default function InvoiceModal({ open, onClose, invoice: baseInvoice }) {
  const { invoice, isLoading, error, refetch } = useInvoice(baseInvoice, { enabled: open });

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Tax invoice" widthVariant="invoice">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Receipt size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">Tax invoice</p>
            <p className="truncate font-mono text-[15px] font-bold text-gray-900 dark:text-gray-50">
              {invoice?.invoiceNumber ? (
                `#${invoice.invoiceNumber}`
              ) : isLoading ? (
                <span className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-gray-400">
                  <LoaderCircle size={13} className="animate-spin" aria-hidden="true" /> Generating…
                </span>
              ) : (
                <span className="font-sans text-[13px] font-medium text-gray-400">Number not available</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {invoice && (
            <>
              <button type="button" onClick={() => window.print()} className={iconBtn} aria-label="Print invoice" title="Print">
                <Printer size={16} aria-hidden="true" />
              </button>
              {invoice.invoiceUrl ? (
                <a
                  href={invoice.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <Download size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
              ) : (
                <span
                  className="ml-1 inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-100 px-3 text-xs font-bold text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  title={isLoading ? 'Preparing the PDF…' : 'PDF not available'}
                >
                  <Download size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Download PDF</span>
                </span>
              )}
            </>
          )}
          <button type="button" onClick={onClose} className={`${iconBtn} ml-1`} aria-label="Close">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <span>Couldn't fetch the invoice number / PDF: {error}</span>
          <button type="button" onClick={refetch} className="font-bold underline">
            Try again
          </button>
        </div>
      )}

      {invoice ? (
        <InvoiceCard invoice={invoice} />
      ) : (
        <p className="px-5 py-8 text-center text-sm text-gray-500">No invoice for this subscription.</p>
      )}
    </Modal>
  );
}
