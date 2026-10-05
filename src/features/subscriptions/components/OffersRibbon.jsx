import { Sparkles } from "lucide-react";

// ⚠️ FIXED: simplified further, per explicit instruction — just each real
// plan's name with its real price, nothing else (no invented offers,
// codes, or upgrade copy).
function buildItems(plans) {
  return plans.map((p) => ({
    text: p.name,
    // code: `₹${Math.round(p.price).toLocaleString("en-IN")}`,
  }));
}

function OfferItem({ text, code }) {
  return (
    <div className="flex items-center gap-2 px-4 shrink-0">
      <span className="text-sm font-medium text-white whitespace-nowrap">{text}</span>
      {/* <span className="text-[10px] font-bold text-white bg-white/25 px-2.5 py-1 rounded-full whitespace-nowrap tracking-wide">
        {code}
      </span> */}
    </div>
  );
}

/**
 * Continuous left-scrolling promo ribbon — same marquee technique as
 * TrustBar.jsx (index.css's `.animate-marquee`), styled as a gradient
 * offer strip instead of a trust-badge row.
 *
 * @param {Object} props
 * @param {Array<{name: string, price: number}>} [props.plans] - all real plans, sorted lowest→highest price
 */
export default function OffersRibbon({ plans = [] }) {
  const items = buildItems(plans);
  // A short item list would otherwise repeat too quickly to read while
  // scrolling — repeat it enough times to fill the ribbon regardless of
  // how many real items there are (the marquee's own seamless-loop trick
  // needs an even number of repeats).
  const track = [...items, ...items, ...items, ...items];

  return (
    // No rounded box — the reference look fades softly into the page at
    // both edges instead of sitting in a hard-cornered pill, via a CSS
    // mask (transparent → opaque → transparent). Colors switched from the
    // reference's pink/orange to Trydood's own emerald brand color (the
    // same green used for every primary button/accent in this app). The
    // background itself is angled (135deg) with a diagonal repeating
    // stripe layered on top — a "sash"/cross pattern — instead of a flat
    // left-to-right gradient; the content on top keeps scrolling exactly
    // as before, independently of this background.
    <div
      className="w-full overflow-hidden mb-6"
      style={{
        background:
          "linear-gradient(135deg, #10b981 0%, #059669 45%, #047857 100%), " +
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 26px)",
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div className="flex items-center w-max py-2.5 animate-marquee">
        {track.map((offer, i) => (
          <div key={i} className="flex items-center">
            <OfferItem text={offer.text} code={offer.code} />
            {i < track.length - 1 && (
              <Sparkles className="w-3.5 h-3.5 text-white/70 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
