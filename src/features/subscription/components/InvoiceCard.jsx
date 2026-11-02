import { CircleCheck } from 'lucide-react';
import { formatCurrencyINR, formatDateDMY, formatDateLong } from '../utils/formatters';

/**
 * Tax invoice body for one subscription — see buildSubscriptionInvoice
 * (subscriptionService) + useInvoice for where each field comes from.
 * The number/actions live in the modal header (InvoiceModal); this is the
 * printable part (`inv-print-area`).
 */
export default function InvoiceCard({ invoice }) {
  const {
    invoiceDate,
    amount,
    paymentStatus,
    billFrom,
    billTo,
    subscriptionId,
    transactionId,
    planName,
    period,
    hsnSacCode,
    placeOfSupply,
    lineItems = [],
  } = invoice;

  const details = [
    { label: 'Plan', value: planName, capitalize: true },
    { label: 'Period', value: period?.start ? `${formatDateDMY(period.start)} → ${formatDateDMY(period.end)}` : null },
    { label: 'Subscription ID', value: subscriptionId, mono: true },
    { label: 'Transaction ID', value: transactionId, mono: true },
    { label: 'HSN / SAC', value: hsnSacCode, mono: true },
    { label: 'Place of supply', value: placeOfSupply },
  ].filter((d) => d.value);

  return (
    <div className="inv-print-area space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3.5 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
        <div>
          <p className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80">Amount paid</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-gray-50">{formatCurrencyINR(amount)}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
            <CircleCheck size={12} strokeWidth={2.5} aria-hidden="true" />
            {paymentStatus === 'PAID' ? 'Paid' : 'Nothing to pay'}
          </span>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{formatDateLong(invoiceDate)}</p>
        </div>
      </div>

      {details.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className="text-[11px] text-gray-500 dark:text-gray-400">{d.label}</dt>
              <dd
                className={`mt-0.5 break-all text-[12.5px] font-semibold text-gray-800 dark:text-gray-100 ${d.mono ? 'font-mono text-[11.5px]' : ''} ${d.capitalize ? 'capitalize' : ''}`}
              >
                {d.capitalize ? String(d.value).toLowerCase() : d.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Party heading="Bill from" party={billFrom} />
        <Party heading="Bill to" party={billTo} />
      </div>

      {lineItems.length > 0 && (
        <div className="rounded-xl ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
          <div className="divide-y divide-gray-100 px-4 dark:divide-gray-700/60">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-2 text-[13px]">
                <span className={item.emphasis ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}>
                  {item.label}
                </span>
                <span
                  className={`shrink-0 tabular-nums ${
                    item.amount < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : item.emphasis
                        ? 'font-semibold text-gray-800 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {item.amount < 0 ? `− ${formatCurrencyINR(Math.abs(item.amount))}` : formatCurrencyINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-b-xl bg-gray-50 px-4 py-2.5 dark:bg-gray-900/40">
            <span className="text-[13px] font-bold text-gray-900 dark:text-gray-50">Total</span>
            <span className="text-base font-extrabold tabular-nums text-gray-900 dark:text-gray-50">{formatCurrencyINR(amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Party({ heading, party }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-900/40">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{heading}</p>
      <p className="mt-1 text-[12.5px] font-bold uppercase text-gray-900 dark:text-gray-50">{party.companyName}</p>
      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-gray-500 dark:text-gray-400" title={party.address}>
        {party.address}
      </p>
      <div className="mt-2 space-y-0.5 font-mono text-[11px] text-gray-600 dark:text-gray-300">
        <p>GSTIN {party.gstin}</p>
        <p>PAN {party.pan}</p>
      </div>
    </div>
  );
}
