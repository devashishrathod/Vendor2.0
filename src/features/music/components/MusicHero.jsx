import { Play } from "lucide-react";

const FEATURE_CHIPS = ["Happy Customers", "Relaxing Ambience", "More Walk-ins"];

// Real royalty-free photo from Pixabay (cdn.pixabay.com, confirmed
// reachable) — a moody salon interior, matching the reference banner.
const HERO_IMAGE = "https://cdn.pixabay.com/photo/2019/03/08/20/17/beauty-salon-4043096_1280.jpg";

export default function MusicHero({ onPlayRecommended }) {
  return (
    <section className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-[#0b1f16] via-[#0f2b1f] to-[#173a27] px-6 py-8 sm:px-10 sm:py-10">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f16] via-[#0b1f16]/85 to-transparent" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(16,185,129,0.45), transparent 40%), radial-gradient(circle at 85% 70%, rgba(16,185,129,0.3), transparent 45%)",
        }}
      />

      <p className="absolute right-6 top-6 hidden sm:block text-emerald-200/60 text-sm italic">Music Moves People</p>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold px-3 py-1 rounded-full mb-4">
          🎵 MUSIC FOR YOUR BUSINESS
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
          Good Vibes. Better Experience.
        </h2>
        <p className="text-emerald-100/70 text-sm mb-6 max-w-sm">
          Curated music to create the perfect atmosphere for your outlet.
        </p>
        <button
          type="button"
          onClick={onPlayRecommended}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
        >
          <Play size={14} fill="currentColor" /> Play Recommended
        </button>
      </div>

      <div className="relative mt-8 flex flex-wrap gap-2 sm:mt-6 sm:justify-end">
        {FEATURE_CHIPS.map((label) => (
          <span
            key={label}
            className="text-[11px] font-medium text-white/80 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
