const DEFAULT_BADGES = [
  {
    icon: "⭐",
    label: "100+ Trusted Partner Ship",
    rating: "100+ (Review)",
  },
  { icon: "🏷️", label: "10,000 New Listing Brand" },
  { icon: "🛒", label: "One Destination, 10000+ Products" },
];

function Badge({ b }) {
  return (
    <div className="flex items-center gap-2 px-4 shrink-0">
      <span className="text-lg">{b.icon}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {b.label}
      </span>
      {b.rating && (
        <>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, s) => (
              <svg
                key={s}
                className="w-4 h-4 text-teal-500 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {b.rating}
          </span>
        </>
      )}
    </div>
  );
}

export default function TrustBar({ badges = DEFAULT_BADGES }) {
  // Rendered twice back-to-back so the marquee-left animation (index.css)
  // can loop seamlessly at exactly -50% — see the comment there.
  const track = [...badges, ...badges];

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-8 py-3 mb-6 overflow-hidden">
      <div className="flex items-center w-max divide-x divide-gray-300 dark:divide-gray-700 animate-marquee">
        {track.map((b, i) => (
          <Badge key={i} b={b} />
        ))}
      </div>
    </div>
  );
}
