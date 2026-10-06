import { IndianRupee, ReceiptText, Tag, Wallet } from "lucide-react";
import { cx } from "../utils/outletUtils";

function formatINR(amount) {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Real voucher-payment totals for this outlet (see
// fetchOutletTransactionSummary) — successful payments only. Replaces the
// old mock amounts, made-up "vs Yesterday" %s and decorative sparklines.
const CARDS = [
  {
    key: "totalCollection",
    label: "Total Collection",
    hint: "Paid by customers",
    icon: Wallet,
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    format: formatINR,
  },
  {
    key: "earnings",
    label: "Your Earnings",
    hint: "Net bill payable to you",
    icon: IndianRupee,
    iconClass: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    format: formatINR,
  },
  {
    key: "discountGiven",
    label: "Discount Given",
    hint: "Voucher offers redeemed",
    icon: Tag,
    iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    format: formatINR,
  },
  {
    key: "count",
    label: "Voucher Transactions",
    hint: null,
    icon: ReceiptText,
    iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    format: (n) => Number(n || 0).toLocaleString("en-IN"),
  },
];

export default function TransactionSummaryPanel({ transactions, error }) {
  if (error) {
    return (
      <div className="rounded-2xl bg-white px-5 py-4 text-sm text-rose-500 dark:bg-gray-800 dark:text-rose-400">
        {error}
      </div>
    );
  }

  const lastPayment = formatDate(transactions?.lastPaymentAt);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const hint =
          card.key === "count"
            ? lastPayment
              ? `Last on ${lastPayment}`
              : "No transactions yet"
            : card.hint;
        return (
          <div key={card.key} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="flex items-center gap-2.5">
              <div className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", card.iconClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {transactions ? card.format(transactions[card.key]) : "—"}
            </p>
            <p className="mt-1 text-xs text-gray-400">{hint}</p>
          </div>
        );
      })}
    </div>
  );
}
