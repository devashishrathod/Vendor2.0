/**
 * The white card every onboarding screen sits in: icon + title header,
 * body, optional right-hand aside (stacks below the body under lg), and a
 * footer slot (usually <StepFooter>).
 * @param {{
 *   icon?: import('react').ElementType,
 *   title: string,
 *   subtitle?: import('react').ReactNode,
 *   headerAside?: import('react').ReactNode,
 *   aside?: import('react').ReactNode,
 *   footer?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function StepCard({ icon: Icon, title, subtitle, headerAside, aside, footer, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] sm:rounded-[20px] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="p-5 sm:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3.5 sm:items-center">
            {Icon && (
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500 shadow-[0_0_0_6px_#F4FBF7] ring-1 ring-emerald-200 sm:size-[52px] sm:rounded-[14px] dark:bg-emerald-500/10 dark:shadow-none dark:ring-emerald-500/30">
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px] dark:text-gray-50">{title}</h1>
              {subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAside && <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">{headerAside}</div>}
        </header>

        <div className={aside ? "mt-6 flex flex-col gap-6 lg:flex-row" : "mt-6"}>
          <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
          {aside && <aside className="flex flex-col gap-3 lg:w-72 lg:shrink-0">{aside}</aside>}
        </div>
      </div>
      {footer}
    </section>
  );
}
