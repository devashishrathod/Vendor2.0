// ─── Outlet Type ────────────────────────────────────────────────────────────
// A separate, simpler concept from Brand Type: is this outlet a standalone
// Outlet, or part of a Franchise network?
export const OUTLET_TYPE_OPTIONS = [
  { value: "outlet", label: "Outlet" },
  { value: "franchise", label: "Franchise" },
];

// ─── Working Hours ──────────────────────────────────────────────────────────
// One row per day, matching the backend schema: { start, end, isOpen }
export const WEEK_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export const DEFAULT_WORKING_HOURS = WEEK_DAYS.reduce((acc, d) => {
  acc[d.key] = { start: "09:00", end: "18:00", isOpen: false };
  return acc;
}, {});

// ─── Showcase Collection ────────────────────────────────────────────────────
// The merchant creates up to MAX_ALBUMS named "albums" (e.g. "Gallery
// Photo", "Menu Photo", "Ambience Photo", "Event Photo"). Each album holds a
// mix of photos/videos:
//   - all albums accept both photos and videos (no video-only album type)
//   - an album named like "Ambience Photo" lets you tag each item with a
//     month, so you can build a month-by-month gallery
//   - every album needs at least 1 item (photo or video) before it's valid
//   - a single album: max 15 items total, of which max 5 can be video
export const MAX_ALBUMS = 5;
export const MAX_ITEMS_PER_ALBUM = 15;
export const MAX_VIDEOS_PER_ALBUM = 5;
export const SHOWCASE_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const QUICK_ALBUM_PRESETS = ["Gallery Photo", "Menu Photo", "Ambience Photo", "Event Photo", ];

// Vibe Clip albums used to be video-only — now they accept photos & videos
// like every other album, so this always returns false. Kept as a function
// (instead of deleting the concept outright) in case a future album type
// needs the same restriction.
export const isVideoOnlyAlbum = () => false;
export const isMonthlyAlbum = (name) => /ambience/i.test(name || "");

// ─── "More Guidelines" modal copy ──────────────────────────────────────────
export const GUIDELINES = {
  logo: {
    title: "Brand Logo Guidelines",
    sections: [
      { heading: "Pixel Size Rules", body: "Upload your logo at a minimum of 500×500 px. Recommended: 1000×1000 px for best quality across all placements." },
      { heading: "Aspect Ratio", body: "Use a 1:1 (square) aspect ratio. Logos with transparent backgrounds (.PNG) are preferred." },
      { heading: "File Size Limit", body: "Maximum file size: 1.5 MB. Compress without losing clarity." },
      { heading: "Do's", body: "✅ Use high-contrast logos\n✅ Ensure text is legible at small sizes\n✅ Use PNG with transparent background" },
      { heading: "Don'ts", body: "❌ No blurry or pixelated images\n❌ No extra whitespace or padding around the logo\n❌ No watermarks" },
    ],
  },
  brandName: {
    title: "Brand Name Guidelines",
    sections: [
      { heading: "What to Enter", body: "Enter the official trading name of your business — exactly how customers should see it on the Trydood app." },
      { heading: "Character Limit", body: "Keep it between 3–60 characters. Avoid unnecessary abbreviations." },
      { heading: "Allowed Characters", body: "Letters, numbers, spaces, &, -, and ' are allowed. Special characters like @, #, $ are not permitted." },
      { heading: "Do's", body: "✅ Use your registered brand/trade name\n✅ Match the name on your GST certificate\n✅ Use Title Case (e.g. Toni & Guy)" },
      { heading: "Don'ts", body: "❌ No generic names like 'Shop' or 'Store'\n❌ No competitor brand names\n❌ No all-caps unless it's your registered name" },
    ],
  },
  brandDescription: {
    title: "Brand Description Guidelines",
    sections: [
      { heading: "What to Write", body: "Describe what your brand offers, its vibe, and what makes it worth visiting — in customers' own words." },
      { heading: "Length", body: "Keep it between 50–300 characters. Short, scannable sentences work best." },
      { heading: "Do's", body: "✅ Mention your specialty or signature offering\n✅ Keep the tone friendly and factual\n✅ Proofread for spelling and grammar" },
      { heading: "Don'ts", body: "❌ No ALL CAPS or excessive punctuation!!!\n❌ No phone numbers, links, or promo codes\n❌ No claims you can't back up (e.g. \"India's #1\")" },
    ],
  },
  listingFeatures: {
    title: "Listing Features Guidelines",
    sections: [
      { heading: "What Counts as a Feature", body: "Short tags that describe what's available at your outlet — e.g. \"Rooftop Seating\", \"Live Music\", \"Pet Friendly\", \"Free Parking\"." },
      { heading: "How Many", body: "Add as many as are genuinely true for this outlet. 3–8 is a good range." },
      { heading: "Feature Images", body: "You can optionally attach one photo per feature (e.g. an actual photo of the rooftop seating area). Use a clear, well-lit shot — square or 4:3 works best. Max 1.5 MB per image." },
      { heading: "Do's", body: "✅ Keep each feature to 2–4 words\n✅ Only add features you actually offer\n✅ Use Title Case for consistency\n✅ Use a real photo of that specific feature, if attaching one" },
      { heading: "Don'ts", body: "❌ No duplicate or near-duplicate tags\n❌ No pricing or promotional text as a \"feature\"\n❌ No features that belong to a different outlet\n❌ No stock/internet photos as the feature image" },
    ],
  },
  workingHours: {
    title: "Working Hours Guidelines",
    sections: [
      { heading: "Why It Matters", body: "Accurate hours prevent customers from showing up when you're closed and improve your ranking in \"open now\" searches." },
      { heading: "Setting a Day", body: "Toggle a day \"Open\" and set its start and end time. Leave a day toggled off if you're closed that day." },
      { heading: "Overnight Hours", body: "If you close after midnight, set the end time for the next day (e.g. 23:00 → 02:00) — this is handled automatically." },
      { heading: "Do's", body: "✅ Double-check AM/PM against the 24-hour display\n✅ Update hours when they change seasonally\n✅ Set every day you're actually open" },
      { heading: "Don'ts", body: "❌ Don't leave hours blank for days you're open\n❌ Don't set an end time earlier than the start time\n❌ Don't mark a day open with no hours filled in" },
    ],
  },
  location: {
    title: "Map & Location Guidelines",
    sections: [
      { heading: "Why Location Matters", body: "Accurate location helps customers find you on the map and improves your discoverability in nearby searches." },
      { heading: "Search Your Outlet", body: "Type your outlet name and city (e.g. \"Toni & Guy Ahmedabad\") and pick the matching result from the list." },
      { heading: "Use Live Location", body: "Alternatively, allow browser location access to auto-detect your current position and address — handy when you're standing at the outlet." },
      { heading: "Google Maps Link", body: "Paste the exact share link from Google Maps (starts with https://maps.app.goo.gl/ or https://www.google.com/maps/) as a backup if search doesn't find your outlet." },
      { heading: "Do's", body: "✅ Search using your outlet's exact name and area\n✅ Verify the pin on the map preview before saving\n✅ Pick the listing that matches your entrance, not a nearby landmark" },
      { heading: "Don'ts", body: "❌ Do not select an approximate area instead of your outlet\n❌ Do not leave the location unselected\n❌ Do not pick a duplicate or unrelated listing" },
    ],
  },
  showcase: {
    title: "Showcase Collection Guidelines",
    sections: [
      { heading: "Albums", body: "Create up to 5 albums — e.g. \"Gallery Photo\", \"Menu Photo\", \"Ambience Photo\", \"Event Photo\". Name each album so customers know what they're looking at." },
      { heading: "Event Photo", body: "\"Event Photo\" style albums accept both event photos and videos." },
      { heading: "Ambience Photo", body: "\"Ambience\" style albums let you tag each upload with a month, so you can keep a running month-wise gallery." },
      { heading: "Limits", body: "Each album needs at least 1 photo or video. Max 15 items per album, of which max 5 can be videos." },
      { heading: "Do's", body: "✅ Use a clear, descriptive album name\n✅ Upload real photos/videos of this outlet\n✅ Keep videos under 60 seconds" },
      { heading: "Don'ts", body: "❌ No stock photos or videos\n❌ No empty albums\n❌ No copyrighted music in videos" },
    ],
  },
};
