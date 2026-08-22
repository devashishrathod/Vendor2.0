const DEFAULT_BADGES = [
  {
    icon: "⭐",
    label: "1 Million Trusted Partner Ship",
    rating: "13,02,55 (Review)",
  },
  { icon: "🏷️", label: "10,00,000 New Listing Brand" },
  { icon: "🛒", label: "One Destination, 5 Million Products" },
];

export default function TrustBar({ badges = DEFAULT_BADGES }) {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-8 py-3 mb-6">
      <div className="flex items-center justify-center gap-6 divide-x divide-gray-300 overflow-x-auto">
        {badges.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 first:pl-0 last:pr-0 shrink-0"
          >
            <span className="text-lg">{b.icon}</span>
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
        ))}
      </div>
    </div>
  );
}
