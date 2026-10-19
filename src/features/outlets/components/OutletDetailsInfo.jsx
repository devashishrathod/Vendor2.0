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
import { cx, toTitleCase } from "../utils/outletUtils";

// Shows everything the confirmed brands/get + subBrands/get-all responses
// carry beyond what OutletDetailsHeader already renders — the outlet's own
// contact/description/type/status/dates, and its saved location (with a
// real embedded map when coordinates exist). (Brand Verification and
// Subscription used to show here too — removed, since this page is about
// the OUTLET, not brand-level billing/verification.)

function InfoRow({ icon: Icon, label, value, copyable, valueNode, valueClassName = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value ?? ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
        {label}
      </span>
      <span className={`flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100 text-right break-words ${valueClassName}`}>
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
    <div className="flex items-start gap-2.5 py-3">
      <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        {label}
      </span>
      <p className="flex-1 text-sm font-normal text-gray-600 dark:text-gray-300 leading-relaxed break-words">
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
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
  sky: { bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-500 dark:text-sky-400" },
};

function SectionCard({ icon, title, subtitle, accent = "emerald", action, children, className }) {
  const color = ACCENTS[accent];
  return (
    <div className={cx("rounded-3xl border border-emerald-100/80 bg-white p-5 sm:p-6 flex flex-col shadow-[0_10px_30px_rgba(4,120,87,0.06)] dark:border-white/5 dark:bg-gray-800 dark:shadow-none", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <div className={cx("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", color.bg, color.text)}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
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

// One day on the shop-timings board.
function DayTile({ label, day, isToday }) {
  const isOpen = !!day?.isOpen;
  return (
    <div
      className={cx(
        "relative flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3 transition-colors",
        isToday
          ? "border-emerald-300 bg-emerald-50 shadow-[0_6px_18px_rgba(4,120,87,0.12)] dark:border-emerald-500/40 dark:bg-emerald-500/10"
          : isOpen
            ? "border-emerald-100 bg-white dark:border-white/10 dark:bg-gray-900/40"
            : "border-dashed border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-gray-900/20"
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cx("text-xs font-bold uppercase tracking-wide", isToday ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400")}>
          {label.slice(0, 3)}
        </span>
        {isToday && (
          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Today</span>
        )}
      </span>
      {isOpen ? (
        <span className="text-[13px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
          {formatTime12h(day?.start)}
          <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">to {formatTime12h(day?.end)}</span>
        </span>
      ) : (
        <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500">Closed</span>
      )}
    </div>
  );
}

// Is the outlet open right now, from today's saved hours? (handles a
// closing time past midnight, e.g. 18:00 – 02:00).
function isOpenNow(day) {
  if (!day?.isOpen || !day.start || !day.end) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const start = toMins(day.start);
  const end = toMins(day.end);
  return end > start ? mins >= start && mins < end : mins >= start || mins < end;
}

export default function OutletDetailsInfo({ outlet, brand, onEdit, onEditLocation }) {
  const doc = outlet?.raw;
  const location = doc?.location;
  const workHours = doc?.workHours;
  const todayKey = JS_DAY_KEYS[new Date().getDay()];
  const openNow = isOpenNow(workHours?.[todayKey]);
  const [lng, lat] = location?.geo?.coordinates || [];
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const isFranchise = outlet?.outletType === OUTLET_TYPES.FRANCHISE;
  const brandName = toTitleCase(brand?.brandName);
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
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
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

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{isFranchise ? "Franchise Outlet" : "Outlet"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isFranchise
                  ? `You are part of the ${brandName || "Trydood"} franchise network.`
                  : `This outlet operates under ${brandName || "your brand"}.`}
              </p>
            </div>
          </div>
          <a href="mailto:support@trydood.com" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap flex items-center gap-1">
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
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/10 rounded-lg px-3 py-1.5 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )
        }
      >
        {location ? (
          <>
            <div className="map-grid-bg mt-2 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3.5 dark:border-white/10 dark:bg-gray-900/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-[0_0_0_6px_rgba(4,120,87,0.12)] dark:bg-emerald-600">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.12em] text-gray-500 dark:text-gray-400">ADDRESS</p>
                <p className="mt-0.5 text-sm font-medium capitalize leading-snug text-gray-800 dark:text-gray-200">{formatAddress(location) || "—"}</p>
              </div>
            </div>
            <InfoRow icon={Building2} label="City / State" value={[location.city, location.state].filter(Boolean).join(", ")} valueClassName="capitalize" />
            <InfoRow icon={Hash} label="Pincode" value={location.zipcode} />

            {hasCoords && (
              <div className="relative mt-4 rounded-xl overflow-hidden h-56">
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none">
                      {brandName || "Outlet"}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                      {[location.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <iframe
                  title="Outlet location map"
                  className="w-full h-full"
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
        action={
          workHours && (
            <span
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                openNow
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              )}
            >
              <span className={cx("h-2 w-2 rounded-full", openNow ? "animate-pulse bg-emerald-500" : "bg-gray-400")} />
              {openNow ? "Open now" : "Closed now"}
            </span>
          )
        }
      >
        {workHours ? (
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {WEEK_DAYS.map(({ key, label }) => (
              <DayTile key={key} label={label} day={workHours[key]} isToday={key === todayKey} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No working hours saved for this outlet yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
