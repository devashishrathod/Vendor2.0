import { ArrowUpRight, FileText, Mail, MessageCircle, ShieldCheck } from "lucide-react";

// Trydood's public site pages — opened in a new tab so the dashboard stays put.
const FOOTER_LINKS = [
  { href: "https://trydood.com/terms-of-service", label: "Terms of Service", icon: FileText },
  { href: "https://trydood.com/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
  { href: "https://trydood.com/contact", label: "Contact Us", icon: MessageCircle },
];

const SUPPORT_EMAIL = "support@trydood.com";

// Same max-w-7xl container as the dashboard pages so the footer lines up
// with the content above it. Every link has an explicit dark-mode hover
// colour — the old hover:text-gray-800 turned links nearly invisible on the
// dark footer.
export default function DashboardFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-white dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-extrabold text-white shadow-md shadow-emerald-500/25">
              T
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                Trydood Retail Private Limited
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Vendor Panel</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-1" aria-label="Footer">
            {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={href}
                className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
              >
                <Icon size={13} className="transition-transform duration-200 group-hover:scale-110" />
                {label}
                <ArrowUpRight
                  size={12}
                  className="-ml-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                />
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="mt-5 flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3 text-[11px] text-gray-500 dark:bg-gray-700/40 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright &copy; {year} Trydood. All rights reserved.</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-1.5 font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Mail size={12} />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
