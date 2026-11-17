/**
 * White section card used across the Create Brand Outlet steps.
 * @param {{
 *   title?: import('react').ReactNode,
 *   subtitle?: import('react').ReactNode,
 *   action?: import('react').ReactNode,   - right side of the header (link, checkbox, badge)
 *   className?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function OutletCard({ title, subtitle, action, className = "", children }) {
  return (
    <section
      className={`rounded-2xl border border-[#E4E9E2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {(title || action) && (
        <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{title}</h2>}
            {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
