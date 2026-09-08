// Shows everything the confirmed brands/get + subBrands/get-all responses
// carry beyond what OutletDetailsHeader already renders — outlet location
// & description, and the brand-level verification/category/subscription
// data, since there's no separate "outlet details" endpoint for any of this.
// Laid out as an asymmetric "bento" grid instead of four uniform boxes —
// Brand Verification (the richest card, badges + category) anchors it as
// a tall card on the left; the other three fill the remaining cells.
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right break-words">{value ?? "—"}</span>
    </div>
  );
}

function VerificationPill({ label, isVerified }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        isVerified ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-50 text-gray-400 border border-gray-100"
      }`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {isVerified ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        )}
      </svg>
      {label}
    </span>
  );
}

// Per-card accent — a distinct icon color for each bento cell so the grid
// reads as separate, scannable tiles instead of four identical boxes.
const ACCENTS = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-500" },
  sky: { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-500" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-500" },
};

function SectionCard({ icon, title, accent = "emerald", span, children }) {
  const color = ACCENTS[accent];
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col ${span || ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${color.border} ${color.bg}`}>
          <span className={color.text}>{icon}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function formatAddress(loc) {
  if (!loc) return null;
  return (
    loc.formattedAddress ||
    [loc.addressLine1, loc.addressLine2, loc.city, loc.state, loc.zipcode].filter(Boolean).join(", ")
  );
}

export default function OutletDetailsInfo({ outlet, brand }) {
  const doc = outlet?.raw;
  const location = doc?.location;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <SectionCard
        accent="indigo"
        span="lg:col-span-1 lg:row-span-2"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Brand Verification"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <VerificationPill label="PAN" isVerified={!!brand?.pan?.isVerified} />
          <VerificationPill label="GST" isVerified={!!brand?.gst?.isVerified} />
          <VerificationPill label="Bank" isVerified={!!brand?.bank?.isVerified} />
          <VerificationPill label="Mobile" isVerified={!!brand?.user?.isMobileVerified} />
        </div>
        <InfoRow label="Category" value={brand?.category?.name} />
        <InfoRow label="Sub Category" value={brand?.subCategory?.name} />
      </SectionCard>

      <SectionCard
        accent="emerald"
        span="sm:col-span-2 lg:col-span-2"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        title="Outlet Details"
      >
        <InfoRow label="WhatsApp Number" value={doc?.whatsappNumber || outlet?.whatsapp?.number} />
        <InfoRow label="Description" value={doc?.description || "—"} />
      </SectionCard>

      <SectionCard
        accent="amber"
        span="lg:col-span-1"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Subscription"
      >
        <InfoRow label="Plan Price" value={brand?.subscribed?.price != null ? `₹${brand.subscribed.price}` : null} />
        <InfoRow label="Paid Amount" value={brand?.subscribed?.paidAmount != null ? `₹${brand.subscribed.paidAmount}` : null} />
        <InfoRow
          label="Valid Till"
          value={
            brand?.subscribed?.endDate
              ? new Date(brand.subscribed.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
              : null
          }
        />
      </SectionCard>

      <SectionCard
        accent="sky"
        span="sm:col-span-2 lg:col-span-3"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="Location"
      >
        {location ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
            <div className="sm:col-span-3">
              <InfoRow label="Address" value={formatAddress(location)} />
            </div>
            <InfoRow label="City / State" value={[location.city, location.state].filter(Boolean).join(", ")} />
            <InfoRow label="Zipcode" value={location.zipcode} />
          </div>
        ) : (
          <p className="text-xs text-gray-400">No location saved for this outlet yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
