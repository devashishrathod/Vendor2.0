import { useState } from "react";
import {
  Store,
  MessageCircle,
  FileText,
  Hash,
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { OUTLET_TYPES } from "../constants/outletConstants";
import { cx } from "../utils/outletUtils";

// Shows everything the confirmed brands/get + subBrands/get-all responses
// carry beyond what OutletDetailsHeader already renders — the outlet's own
// contact/description/type/status/dates, and its saved location (with a
// real embedded map when coordinates exist). (Brand Verification and
// Subscription used to show here too — removed, since this page is about
// the OUTLET, not brand-level billing/verification.)

function InfoRow({ icon: Icon, label, value, copyable, valueNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value ?? ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="flex items-center gap-2.5 text-sm text-gray-500 shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 text-right break-words">
        {valueNode ?? (value ?? "—")}
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-emerald-500 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </span>
    </div>
  );
}

// Label and text start on the same top-aligned line (not label-above,
// text-starting-below) — a "Read more"/"Read less" toggle handles long
// descriptions instead of always showing the full text.
function DescriptionRow({ icon: Icon, label, value }) {
  const [expanded, setExpanded] = useState(false);
  const text = value || "—";
  const isLong = text.length > 140;
  const shown = expanded || !isLong ? text : `${text.slice(0, 140)}…`;

  return (
    <div className="flex items-start gap-2.5 py-3 border-b border-gray-50 last:border-0">
      <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 shrink-0">
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        {label}
      </span>
      <p className="flex-1 text-sm font-normal text-gray-600 leading-relaxed break-words">
        {shown}
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="ml-1.5 text-emerald-600 font-semibold hover:underline"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </p>
    </div>
  );
}

const ACCENTS = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
  sky: { bg: "bg-sky-50", text: "text-sky-500" },
};

function SectionCard({ icon, title, subtitle, accent = "emerald", action, children, className }) {
  const color = ACCENTS[accent];
  return (
    <div className={cx("bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <div className={cx("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", color.bg, color.text)}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1 mt-2">{children}</div>
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

// Confirmed real shape (see subBrandApi.js's workHours/upsert body and the
// subBrands/get-all response) — workHours.{monday..sunday}: { start, end,
// isOpen }, keyed by lowercase weekday name.
const WEEK_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];
// JS Date#getDay() is 0=Sunday..6=Saturday — this maps that index to the
// matching WEEK_DAYS key, used only to highlight "today" in the list.
const JS_DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function formatTime12h(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function WorkHoursRow({ label, day, isToday }) {
  const isOpen = !!day?.isOpen;
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg",
        isToday ? "bg-emerald-50" : ""
      )}
    >
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <span className={cx("w-1.5 h-1.5 rounded-full shrink-0", isOpen ? "bg-emerald-500" : "bg-gray-300")} />
        {label}
        {isToday && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-100 rounded-full px-1.5 py-0.5">
            Today
          </span>
        )}
      </span>
      <span className={cx("text-sm font-semibold", isOpen ? "text-gray-800" : "text-gray-400")}>
        {isOpen ? `${formatTime12h(day?.start)} – ${formatTime12h(day?.end)}` : "Closed"}
      </span>
    </div>
  );
}

export default function OutletDetailsInfo({ outlet, brand, onEdit, onEditLocation }) {
  const doc = outlet?.raw;
  const location = doc?.location;
  const workHours = doc?.workHours;
  const todayKey = JS_DAY_KEYS[new Date().getDay()];
  const [lng, lat] = location?.geo?.coordinates || [];
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const isFranchise = outlet?.outletType === OUTLET_TYPES.FRANCHISE;
  // "Business Since" — the year the outlet joined (a real, derived value,
  // not a separate field the backend tracks).
  const businessSince = outlet?.joinedDate ? new Date(outlet.joinedDate).getFullYear() : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard
        accent="emerald"
        icon={<Store className="w-5 h-5" />}
        title="Outlet Information"
        subtitle="Basic information about this outlet."
        action={
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Details
          </button>
        }
      >
        <DescriptionRow icon={FileText} label="Description" value={doc?.description} />
        <InfoRow icon={MessageCircle} label="WhatsApp Number" value={doc?.whatsappNumber || outlet?.whatsapp?.number} copyable />
        <InfoRow icon={Hash} label="Store Id" value={outlet?.storeId} copyable />
        <InfoRow icon={BadgeCheck} label="Outlet Type" value={isFranchise ? "Franchise" : "Outlet"} />
        {/* <InfoRow icon={Clock} label="Status" valueNode={<StatusBadge status={outlet?.status} />} /> */}
        <InfoRow icon={CalendarDays} label="Joining Date" value={outlet?.joinedDate ? new Date(outlet.joinedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
        {/* <InfoRow icon={Clock} label="Business Since" value={businessSince} /> */}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{isFranchise ? "Franchise Outlet" : "Outlet"}</p>
              <p className="text-xs text-gray-500">
                {isFranchise
                  ? `You are part of the ${brand?.brandName || "Trydood"} franchise network.`
                  : `This outlet operates under ${brand?.brandName || "your brand"}.`}
              </p>
            </div>
          </div>
          <a href="mailto:support@trydood.com" className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap flex items-center gap-1">
            Need help? Contact Support →
          </a>
        </div>
      </SectionCard>

      <SectionCard
        accent="sky"
        icon={<MapPin className="w-5 h-5" />}
        title="Outlet Location"
        subtitle="Complete address and map location."
        action={
          onEditLocation && (
            <button
              onClick={onEditLocation}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 rounded-lg px-3 py-1.5 hover:bg-sky-100 transition-colors whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )
        }
      >
        {location ? (
          <>
            <InfoRow icon={MapPin} label="Address" value={formatAddress(location)} />
            <InfoRow icon={Building2} label="City / State" value={[location.city, location.state].filter(Boolean).join(", ")} />
            <InfoRow icon={Hash} label="Pincode" value={location.zipcode} />

            {hasCoords && (
              <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-100 h-56">
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 lowercase leading-none">
                      {brand?.brandName || "Outlet"}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                      {[location.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <iframe
                  title="Outlet location map"
                  className="w-full h-full border-0"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                  loading="lazy"
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">No location saved for this outlet yet.</p>
        )}
      </SectionCard>

      <SectionCard
        accent="emerald"
        icon={<Clock className="w-5 h-5" />}
        title="Working Hours"
        subtitle="Open/close time for each day of the week."
        className="lg:col-span-2"
      >
        {workHours ? (
          <div className="divide-y divide-gray-50">
            {WEEK_DAYS.map(({ key, label }) => (
              <WorkHoursRow key={key} label={label} day={workHours[key]} isToday={key === todayKey} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No working hours saved for this outlet yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
