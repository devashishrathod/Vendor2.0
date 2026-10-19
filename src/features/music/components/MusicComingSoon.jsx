import { Eye, Headphones, ListMusic, Music2, Radio, Sparkles } from "lucide-react";

// Heights + staggered delays for the hero equalizer. Literal class strings so
// Tailwind picks them up at build time.
const EQ_BARS = [
  "h-5 [animation-delay:0ms]",
  "h-8 [animation-delay:120ms]",
  "h-10 [animation-delay:260ms]",
  "h-7 [animation-delay:80ms]",
  "h-9 [animation-delay:340ms]",
  "h-10 [animation-delay:180ms]",
  "h-6 [animation-delay:40ms]",
  "h-9 [animation-delay:300ms]",
  "h-5 [animation-delay:140ms]",
];

// What the music section will do — each one maps to a piece already in
// progress in features/music (collections, playlists, requests, player).
const UPCOMING_FEATURES = [
  {
    icon: Sparkles,
    title: "Curated collections",
    text: "Hand-picked music by mood, language and artist, chosen for salons, cafés and stores.",
  },
  {
    icon: ListMusic,
    title: "Your own playlists",
    text: "Build playlists for mornings, rush hours and closing time, and switch in one tap.",
  },
  {
    icon: Radio,
    title: "Request a playlist",
    text: "Tell us your outlet's vibe and our team will put a playlist together for you.",
  },
  {
    icon: Headphones,
    title: "Non-stop player",
    text: "Music keeps playing while you check orders, vouchers and settlements.",
  },
];

/**
 * Full-page "Coming soon" screen for the Playlist Music section.
 * @param {{ onPreview: () => void }} props  opens the in-progress music pages
 */
export default function MusicComingSoon({ onPreview }) {
  return (
    <div className="min-h-screen bg-app pb-16 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f16] via-[#0f2b1f] to-[#173a27] px-6 py-8 text-center shadow-lg sm:px-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-teal-400/20 blur-3xl" />

          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Coming soon
            </span>

            <div aria-hidden="true" className="mx-auto mb-4 flex h-10 items-end justify-center gap-1">
              {EQ_BARS.map((bar, i) => (
                <span
                  key={i}
                  className={`block w-1.5 origin-bottom animate-eq rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 ${bar}`}
                />
              ))}
            </div>

            <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl">
              Music for your outlet is almost here
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-emerald-100/75">
              We're building a music library made for businesses. Set the right mood for your
              customers, right from your Trydood panel.
            </p>

            <div className="mt-5 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onPreview}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-400"
              >
                <Eye size={16} />
                See what we're building
              </button>
              <p className="flex items-center gap-1.5 text-[12px] text-emerald-100/50">
                <Music2 size={12} />
                Early preview — some things may not work yet.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            What's coming
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING_FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Icon size={18} />
                </span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
