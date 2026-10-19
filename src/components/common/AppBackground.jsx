/**
 * Soft blurred green glows that sit behind page content. Pair with the
 * `.app-shell-bg` class (index.css) on the parent, which supplies the base
 * gradient. The parent must create a stacking context (Tailwind `isolate`)
 * so the glows (`-z-10`) paint above its background but below its content.
 * Fixed to the viewport, so they stay put while long pages scroll.
 */
export default function AppBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* emerald/teal follow the Theme Color preset (index.css); app-glow-3
          is hidden in light mode for non-default presets so the page fades
          to white at the bottom. */}
      <div className="app-glow-1 absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/10" />
      <div className="app-glow-2 absolute right-[-6rem] top-40 h-[28rem] w-[28rem] rounded-full bg-teal-200/50 blur-3xl dark:bg-teal-500/10" />
      <div className="app-glow-3 absolute bottom-[-8rem] left-1/3 h-96 w-[32rem] rounded-full bg-lime-200/40 blur-3xl dark:bg-emerald-400/5" />
    </div>
  );
}
