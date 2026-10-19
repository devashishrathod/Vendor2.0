import { Link } from "react-router-dom";
import { Images, Store, Ticket, Wallet } from "lucide-react";

const ACTIONS = [
  { label: "New Voucher", to: "/vouchers/new", icon: Ticket, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { label: "Outlets", to: "/outlets", icon: Store, tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
  { label: "Showcase", to: "/account-information", icon: Images, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" },
  { label: "Settlements", to: "/settlements", icon: Wallet, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
];

/** Shortcut tiles to the vendor's most common tasks. */
export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map(({ label, to, icon: Icon, tone }, i) => (
        <Link
          key={label}
          to={to}
          className="animate-fade-up group bento-card flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${tone}`}>
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        </Link>
      ))}
    </div>
  );
}
