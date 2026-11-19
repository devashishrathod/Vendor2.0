import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  EyeOff,
  FileText,
  ImageOff,
  Images,
  Landmark,
  ListChecks,
  Lock,
  MapPin,
  Pencil,
  Plus,
  SkipForward,
} from "lucide-react";
import { WEEK_DAYS } from "../../constants/brandOutletConstants";
import { useOnboardingV2Store } from "@/features/onboarding-v2/store/onboardingStore";
import { BRANCHES, branchFromKycPath } from "@/features/onboarding-v2/config/onboardingFlow";
import { useOnboardingStatusStore, selectKycPath } from "@/features/onboarding-v2/store/statusStore";
import { readGstRecord, readOwnerIdentity, readPanRecord } from "@/features/onboarding-v2/steps/verification/verificationRecords";
import AddBankModal from "./layout/AddBankModal";
import AddDocumentsModal from "./layout/AddDocumentsModal";

const SUBMIT_CHECKS = [
  "PAN ↔ GST ↔ legal name match",
  "GST is active",
  "Documents readable and titled",
  "Bank name matches business",
];

const REGISTRATION_LABELS = {
  [BRANCHES.GST]: "Registered · GST",
  [BRANCHES.REG_NO_GST]: "Registered · no GST",
  [BRANCHES.UNREGISTERED]: "Not registered",
};

const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatInr = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";

const maskAccount = (acc = "") => (acc ? `XXXX XXXX ${String(acc).slice(-4)}` : "");

const fileSize = (bytes) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : "");

/** Data of a verify response, whichever wrapper it came in. */
const recordData = (r) => r?.data ?? r ?? {};

function hoursSummary(workingHours) {
  const open = WEEK_DAYS.filter((d) => workingHours[d.key]?.isOpen);
  const closed = WEEK_DAYS.filter((d) => !workingHours[d.key]?.isOpen);
  if (open.length === 0) return "Closed every day";
  if (closed.length === 0) return "Open every day";
  const short = (list) => list.map((d) => d.label.slice(0, 3)).join(", ");
  return `${short(open)} open · ${short(closed)} closed`;
}

/** One thumbnail, or a dashed "No logo / No cover" placeholder with an Add link. */
function Thumb({ url, label, emptyLabel, className, onAdd }) {
  if (url) {
    return (
      <figure className="flex flex-col gap-1">
        <img
          src={url}
          alt={label}
          className={`${className} rounded-lg bg-gray-50 object-cover ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700`}
        />
        <figcaption className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">✓ {label}</figcaption>
      </figure>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onAdd}
        className={`${className} flex flex-col items-center justify-center gap-0.5 rounded-lg border-[1.5px] border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-600 dark:bg-gray-900/40`}
      >
        <ImageOff size={16} aria-hidden="true" />
        <span className="text-[10.5px] font-bold">{emptyLabel}</span>
      </button>
      <span className="text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">Tap to add</span>
    </div>
  );
}

function LogoCoverThumbs({ logoUrl, coverUrl, onAdd }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Thumb url={logoUrl} label="Logo" emptyLabel="No logo" className="size-16 object-contain" onAdd={onAdd} />
      <Thumb url={coverUrl} label="Cover" emptyLabel="No cover" className="h-16 w-36" onAdd={onAdd} />
    </div>
  );
}

/**
 * Everything the vendor skipped, in one place at the top of the review,
 * each with an Add button (or a note when it can only be added later).
 * @param {{ items: { key: string, icon: import('react').ElementType, title: string, hint: string, onAdd?: () => void, laterNote?: string }[] }} props
 */
function SkippedPanel({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-1 overflow-hidden rounded-[14px] border border-amber-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-amber-500/30 dark:bg-gray-800">
      <header className="flex items-start gap-3 border-b border-amber-100 bg-amber-50/80 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white text-amber-600 ring-1 ring-inset ring-amber-200 dark:bg-gray-900 dark:text-amber-400 dark:ring-amber-500/30">
          <SkipForward size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold text-amber-900 dark:text-amber-200">
            You skipped {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          <p className="mt-px text-xs text-amber-800/90 dark:text-amber-300/90">
            You can still submit, but adding these helps our team approve your outlet faster.
          </p>
        </div>
      </header>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map(({ key, icon: Icon, title, hint, onAdd, laterNote }) => (
          <li key={key} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:ring-gray-700">
              <Icon size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100">
                {title}
                <span className="rounded-full bg-amber-50 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
                  Skipped
                </span>
              </p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500 dark:text-gray-400">{laterNote || hint}</p>
            </div>
            {onAdd ? (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-[10px] bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                Add
              </button>
            ) : (
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10.5px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Add later
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const DESCRIPTION_PREVIEW_CHARS = 140;

/** Long text clamped to 2 lines with a Read more / Read less toggle. */
function ReadMore({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-[12.5px] font-semibold text-gray-400">No description yet</p>;
  const long = text.length > DESCRIPTION_PREVIEW_CHARS;
  return (
    <div>
      <p className={`whitespace-pre-line break-words text-[12.5px] leading-relaxed text-gray-800 dark:text-gray-200 ${long && !expanded ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-[11.5px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-0.5 break-words text-[12.5px] font-bold text-gray-900 dark:text-gray-100">{children || "—"}</div>
    </div>
  );
}

/** Brand details body: media on the left, contact + description on the right. */
function BrandBody({ logoUrl, coverUrl, email, contact, description, onAddMedia }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <LogoCoverThumbs logoUrl={logoUrl} coverUrl={coverUrl} onAdd={onAddMedia} />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem label="Email">{email}</InfoItem>
          <InfoItem label="Contact number">{contact}</InfoItem>
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium text-gray-500 dark:text-gray-400">Description</p>
          <div className="mt-0.5">
            <ReadMore text={description} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One tile in the Listing & Showcase section — the value, or Skipped + Add. */
function ExtraTile({ icon: Icon, title, skipped, onAdd, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/40">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-[0_1px_2px_rgba(16,24,40,0.06)] dark:bg-gray-800 dark:text-emerald-400">
        <Icon size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100">{title}</p>
          {skipped && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
            >
              <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
              Add
            </button>
          )}
        </div>
        <div className="mt-1 text-[12px] text-gray-600 dark:text-gray-400">
          {skipped ? <span className="font-semibold text-amber-700 dark:text-amber-400">Skipped</span> : children}
        </div>
      </div>
    </div>
  );
}

/** "18:00" → "6:00 PM" */
const to12h = (value) => {
  const [h, m] = String(value || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value || "";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** Outlet & hours body: type, WhatsApp and address on the left, the week on the right. */
function OutletBody({ typeLabel, whatsapp, whatsappVerified, address, workingHours }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Outlet type">{typeLabel}</InfoItem>
          <InfoItem label="WhatsApp">
            {whatsapp ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                +91 {whatsapp}
                {whatsappVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <BadgeCheck size={11} aria-hidden="true" />
                    Verified
                  </span>
                )}
              </span>
            ) : null}
          </InfoItem>
        </div>
        <div className="flex min-w-0 items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900/40">
          <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium text-gray-500 dark:text-gray-400">Address</p>
            <p className="mt-0.5 break-words text-[12.5px] font-semibold leading-snug text-gray-900 dark:text-gray-100">{address || "—"}</p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900/40">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium text-gray-500 dark:text-gray-400">
          <Clock size={12} aria-hidden="true" />
          Working hours
        </p>
        <ul className="flex flex-col gap-1">
          {WEEK_DAYS.map((day) => {
            const d = workingHours?.[day.key];
            const open = d?.isOpen && d.start && d.end;
            return (
              <li key={day.key} className="flex items-center justify-between gap-2 text-[12px]">
                <span className={`w-9 font-bold ${open ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>{day.label.slice(0, 3)}</span>
                {open ? (
                  <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                    {to12h(d.start)} – {to12h(d.end)}
                  </span>
                ) : (
                  <span className="font-semibold text-gray-400">Closed</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Masked account number with an eye toggle to show the full number. */
function AccountNumber({ full }) {
  const [visible, setVisible] = useState(false);
  if (!full) return <span>—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono tracking-wider">{visible ? full : maskAccount(full)}</span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide account number" : "Show account number"}
        title={visible ? "Hide" : "Show"}
        className="grid size-7 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700 dark:hover:text-emerald-400"
      >
        {visible ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
      </button>
    </span>
  );
}

/** "2017-07-01T00:00:00.000Z" → "01/07/2017"; other formats are shown as sent. */
const formatRegDate = (value) => {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function Section({ section, open, onToggle }) {
  const { title, summary, locked, onEdit, rows = [], skipped, body } = section;
  // Nothing to show (skipped, or every value empty) → no expand toggle.
  const hasData = !skipped && (Boolean(body) || rows.some((r) => r.node || r.value));
  const isOpen = open && hasData;
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E4E9E2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3 px-3.5 py-[11px]">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${
            locked ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          }`}
          aria-hidden="true"
        >
          {locked ? <Lock size={15} strokeWidth={2} /> : <Pencil size={15} strokeWidth={2} />}
        </span>
        {hasData ? (
          <button type="button" onClick={onToggle} aria-expanded={isOpen} className="min-w-0 flex-1 text-left">
            <p className="text-[13.5px] font-extrabold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="mt-px truncate text-xs text-gray-600 dark:text-gray-400">{summary}</p>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-extrabold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="mt-px truncate text-xs text-gray-600 dark:text-gray-400">{summary}</p>
          </div>
        )}
        {skipped ? (
          <>
            <span className="hidden shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200 sm:inline dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
              Skipped
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex shrink-0 items-center gap-1 rounded-[10px] bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
                Add
              </button>
            )}
          </>
        ) : locked ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10.5px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Locked
          </span>
        ) : (
          onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 rounded-[10px] border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
              Edit
            </button>
          )
        )}
        {hasData && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${title}`}
            className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
          >
            <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>
      {isOpen && body && <div className="px-3.5 pb-3.5 pt-1 sm:pl-[58px]">{body}</div>}
      {isOpen && !body && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 px-3.5 pb-3.5 pt-1 sm:grid-cols-2 sm:pl-[58px] lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className={`min-w-0 ${r.wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400">{r.label}</p>
              {r.node ? (
                <div className="mt-1">{r.node}</div>
              ) : (
                <p className="mt-0.5 break-words text-[12.5px] font-bold text-gray-900 dark:text-gray-100">{r.value || "—"}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Step 3 · Review & submit (design 18). Locked sections show what onboarding
 * verified (business, PAN, GST, bank, contract, plan); editable ones jump
 * back to the step that owns them. No new API calls — "Submit for review"
 * is the page's own `onCreate` (= handleSave), gated by `canFinalSave`.
 */
export default function ReviewStep({
  logoUrl,
  coverUrl,
  brandName,
  brandEmail,
  mobile,
  description,
  categoryName,
  subCategoryName,
  outletTypeLabel,
  outletWhatsapp,
  whatsappVerified,
  address,
  workingHours,
  listingFeatureCount = 0,
  showcaseAlbums,
  minItemsPerAlbum,
  hasListingFeature = true,
  hasShowcaseAlbum = true,
  listingSkipped = false,
  showcaseSkipped = false,
  subscription,
  canFinalSave,
  saving,
  onEditStep1,
  onEditStep2,
  onOpenAdvanced,
  onAddListing,
  onAddShowcase,
  onOpenShowcase,
  onBack,
  onCreate,
}) {
  const form = useOnboardingV2Store((s) => s.form);
  // Path and strength come from the server's onboarding status (guide §3, §11).
  const branch = branchFromKycPath(useOnboardingStatusStore(selectKycPath));
  const profileStrength = useOnboardingStatusStore((s) => s.status?.profileStrength);
  const [open, setOpen] = useState({ brand: true, listing: true, showcase: true });
  const [docsOpen, setDocsOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const incompleteAlbums = showcaseSkipped ? [] : showcaseAlbums.filter((a) => a.media.length < minItemsPerAlbum);
  const listingMissing = !hasListingFeature && !listingSkipped;
  const showcaseMissing = !hasShowcaseAlbum && !showcaseSkipped;
  const advancedMissing = listingMissing || showcaseMissing || incompleteAlbums.length > 0;
  const docsSkipped = !(form.documents || []).some((d) => d.status === "uploaded");
  const bankSkipped = !form.bankDetails;
  const skippedItems = [
    listingSkipped && {
      key: "listing",
      icon: ListChecks,
      title: "Listing Features",
      hint: "What your outlet offers — Wi-Fi, parking, live music…",
      onAdd: onAddListing,
    },
    showcaseSkipped && {
      key: "showcase",
      icon: Images,
      title: "Showcase Collection",
      hint: `Photos or videos of your place, menu or events (${minItemsPerAlbum}+ per album).`,
      onAdd: onAddShowcase,
    },
    docsSkipped && {
      key: "docs",
      icon: FileText,
      title: "Business documents",
      hint: "Licence, shop photo or registration proof — helps us verify you faster.",
      onAdd: () => setDocsOpen(true),
    },
    bankSkipped && {
      key: "bank",
      icon: Landmark,
      title: "Bank account",
      hint: "Needed to receive payouts — verified instantly.",
      onAdd: () => setBankOpen(true),
    },
  ].filter(Boolean);

  const sections = useMemo(() => {
    const gst = recordData(form.gstDetails);
    const gstRecord = readGstRecord(form.gstDetails);
    const pan = recordData(form.panDetails);
    const bank = recordData(form.bankDetails?.result ?? form.bankDetails);
    const isUnregistered = branch === BRANCHES.UNREGISTERED;
    const panNumber = isUnregistered ? form.ownerKyc?.pan : form.pan || form.ownerKyc?.pan;
    const panName = isUnregistered ? form.ownerKyc?.panName : pan.fullName || form.ownerKyc?.panName;
    // Not registered: the PAN shown is the owner's (form.ownerKyc), with how they proved identity.
    const panRecord = readPanRecord(isUnregistered ? form.ownerKyc?.panDetails : form.panDetails);
    const identity = isUnregistered ? readOwnerIdentity(form.ownerKyc) : null;
    const legalName = form.legalName || gst.legalName || panName || "";
    const category = subCategoryName ? `${categoryName} › ${subCategoryName}` : categoryName;
    const registration = REGISTRATION_LABELS[branch] || "";
    const entity = form.entityType ? titleCase(form.entityType) : "";
    const docs = (form.documents || []).filter((d) => d.status === "uploaded");
    const plan = subscription?.plan || {};
    const planLabel = [plan.name, subscription?.durationLabel].filter(Boolean).join(" · ");

    const list = [
      {
        key: "business",
        title: "Business details",
        locked: true,
        summary: [legalName, registration, entity].filter(Boolean).join(" · "),
        rows: [
          { label: "Legal name", value: legalName },
          { label: "Brand name", value: brandName },
          { label: "Category", value: category },
          { label: "Registration", value: registration },
          { label: "Business entity", value: entity },
        ],
      },
      {
        key: "pan",
        title: isUnregistered ? "Owner PAN" : "PAN",
        locked: true,
        summary: panNumber ? `${panNumber} · Verified` : "Not verified",
        rows: [
          { label: "PAN", value: panNumber },
          { label: "Name on PAN", value: panName },
          { label: "PAN type", value: panRecord.panType ? titleCase(panRecord.panType) : panRecord.holderType || "" },
          ...(isUnregistered
            ? [
                { label: panRecord.holderType === "Individual" ? "Date of birth" : "Date of incorporation", value: panRecord.dateOfIncorporation },
                { label: "PAN status", value: panRecord.status },
                { label: "Aadhaar linked", value: panRecord.aadhaarLinked },
                { label: "Identity", value: identity.method },
                { label: identity.detailLabel, value: identity.detail },
              ]
            : []),
        ].filter((r) => r.value),
      },
    ];

    if (form.gstin) {
      list.push({
        key: "gst",
        title: "GST",
        locked: true,
        summary: `${form.gstin} · ${titleCase(gstRecord.registrationStatus || "Active")}`,
        rows: [
          { label: "GSTIN", value: gstRecord.gstNumber || form.gstin },
          { label: "Legal name", value: gstRecord.legalName },
          { label: "Trade name", value: gstRecord.tradeName },
          { label: "Business structure", value: gstRecord.constitution },
          { label: "Taxpayer type", value: gstRecord.taxpayerType ? titleCase(gstRecord.taxpayerType) : "" },
          { label: "Registration date", value: formatRegDate(gstRecord.registrationDate) },
          { label: "Registration status", value: titleCase(gstRecord.registrationStatus || "Active") },
        ].filter((r) => r.value),
      });
    }

    list.push(
      {
        key: "docs",
        title: "Business documents",
        locked: false,
        skipped: docs.length === 0,
        onEdit: () => setDocsOpen(true),
        summary: docs.length ? `${docs.length} document${docs.length === 1 ? "" : "s"} added` : "Skipped · add later from your profile",
        rows: docs.length
          ? docs.map((d) => ({ label: d.title || "Document", value: [d.fileName, fileSize(d.fileSize)].filter(Boolean).join(" · ") }))
          : [{ label: "Documents", value: "None added yet" }],
      },
      {
        key: "bank",
        title: "Bank account",
        // Verified accounts are locked; a skipped one can be added from here.
        locked: Boolean(form.bankDetails),
        skipped: !form.bankDetails,
        onEdit: form.bankDetails ? undefined : () => setBankOpen(true),
        summary: form.bankDetails
          ? [bank.bank_name, form.bank?.accountNumber && `••${String(form.bank.accountNumber).slice(-4)}`, "Verified"].filter(Boolean).join(" · ")
          : "Skipped · add later from your profile",
        rows: form.bankDetails
          ? [
              {
                label: "Account number",
                node: (
                  <span className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100">
                    <AccountNumber full={form.bank?.accountNumber || form.bankDetails?.enteredAccountNumber} />
                  </span>
                ),
              },
              { label: "IFSC", value: bank.account_ifsc || form.bank?.ifsc },
              { label: "Holder", value: bank.account_holder_name },
            ]
          : [{ label: "Bank account", value: "Not added — you can't sell vouchers until it's added" }],
      },
      {
        key: "deed",
        title: "Partner contract",
        locked: true,
        summary: form.contractAcceptedAt ? `Accepted on ${formatDate(form.contractAcceptedAt)}` : "Accepted",
        rows: [
          { label: "Accepted by", value: legalName },
          { label: "Accepted on", value: formatDate(form.contractAcceptedAt) },
        ],
      },
      {
        key: "plan",
        title: "Plan",
        locked: true,
        summary: subscription
          ? [planLabel, subscription.paidAmount != null && `${formatInr(subscription.paidAmount)} paid`].filter(Boolean).join(" · ")
          : "Active",
        rows: [
          { label: "Plan", value: planLabel },
          { label: "Paid", value: formatInr(subscription?.paidAmount) },
          { label: "Valid till", value: formatDate(subscription?.endDate) },
        ],
      },
      {
        key: "brand",
        title: "Brand details",
        locked: false,
        onEdit: onEditStep1,
        summary:
          [logoUrl ? "Logo" : "No logo", coverUrl ? "Cover" : "No cover", brandEmail, mobile].filter(Boolean).join(" · ") ||
          "Email, contact number, description",
        body: (
          <BrandBody
            logoUrl={logoUrl}
            coverUrl={coverUrl}
            email={brandEmail}
            contact={mobile}
            description={description}
            onAddMedia={onEditStep1}
          />
        ),
      },
      {
        key: "listing",
        title: "Listing features",
        locked: false,
        skipped: listingSkipped,
        onEdit: listingSkipped ? onAddListing : onOpenAdvanced,
        summary: listingSkipped
          ? "Skipped · add later to get approved faster"
          : `${listingFeatureCount} feature${listingFeatureCount === 1 ? "" : "s"} added`,
        body: (
          <ExtraTile icon={ListChecks} title="Listing features" skipped={listingSkipped}>
            {listingFeatureCount ? `${listingFeatureCount} feature${listingFeatureCount === 1 ? "" : "s"} added` : "None added yet"}
          </ExtraTile>
        ),
      },
      {
        key: "showcase",
        title: "Showcase",
        locked: false,
        skipped: showcaseSkipped,
        onEdit: showcaseSkipped ? onAddShowcase : onOpenShowcase,
        summary: showcaseSkipped
          ? "Skipped · add later to get approved faster"
          : `${showcaseAlbums.length} album${showcaseAlbums.length === 1 ? "" : "s"}`,
        body: (
          <ExtraTile icon={Images} title="Showcase albums" skipped={showcaseSkipped}>
            {showcaseAlbums.length ? (
              <span className="flex flex-wrap gap-1.5">
                {showcaseAlbums.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.06)] dark:bg-gray-800 dark:text-gray-300"
                  >
                    {a.name || "Album"} · {a.media.length}
                  </span>
                ))}
              </span>
            ) : (
              "No albums yet"
            )}
          </ExtraTile>
        ),
      },
      {
        key: "outlet",
        title: "Outlet & working hours",
        locked: false,
        onEdit: onEditStep2,
        summary: [outletTypeLabel, outletWhatsapp && `+91 ${outletWhatsapp}`, hoursSummary(workingHours)].filter(Boolean).join(" · "),
        body: (
          <OutletBody
            typeLabel={outletTypeLabel}
            whatsapp={outletWhatsapp}
            whatsappVerified={whatsappVerified}
            address={address}
            workingHours={workingHours}
          />
        ),
      },
    );
    return list;
  }, [
    form,
    branch,
    subscription,
    brandName,
    brandEmail,
    mobile,
    description,
    categoryName,
    subCategoryName,
    logoUrl,
    coverUrl,
    listingFeatureCount,
    listingSkipped,
    showcaseAlbums,
    showcaseSkipped,
    outletTypeLabel,
    outletWhatsapp,
    whatsappVerified,
    address,
    workingHours,
    onEditStep1,
    onEditStep2,
    onAddListing,
    onAddShowcase,
    onOpenAdvanced,
    onOpenShowcase,
  ]);

  const strength = { score: profileStrength?.score ?? 0, level: profileStrength?.level ?? "" };

  return (
    <div className="flex flex-col gap-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Outlet details
        </button>
      )}

      <header className="flex flex-col gap-4 rounded-2xl border border-[#E4E9E2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
            <ClipboardCheck size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">Final step</p>
            <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-50">Review all details</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              Check everything once before you submit. Open any section to see the full details — unlocked sections can still be edited.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11.5px] font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <ListChecks size={13} aria-hidden="true" />
            {sections.length} sections
          </span>
          {skippedItems.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <SkipForward size={13} aria-hidden="true" />
              {skippedItems.length} skipped
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-[11.5px] font-semibold text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
            <Lock size={12} aria-hidden="true" />
            Verified · can&apos;t be changed here
          </span>
        </div>
      </header>

    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-2">

        <SkippedPanel items={skippedItems} />
        <AddDocumentsModal open={docsOpen} onClose={() => setDocsOpen(false)} />
        <AddBankModal open={bankOpen} onClose={() => setBankOpen(false)} />

        {sections.map((section) => (
          <Section key={section.key} section={section} open={!!open[section.key]} onToggle={() => toggle(section.key)} />
        ))}
      </div>

      <aside className="flex flex-col gap-3 rounded-2xl border border-[#E4E9E2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.10)] lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">When you submit</p>
        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">We run system verification automatically</p>
        <ul className="flex flex-col gap-2 text-[12.5px] text-gray-700 dark:text-gray-300">
          {SUBMIT_CHECKS.map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full ring-2 ring-inset ring-gray-300 dark:ring-gray-600" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-400">
          If a check fails, we'll show what to fix before sending it to our team.
        </p>

        {advancedMissing && (
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            <p className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={13} aria-hidden="true" />
              Required before submitting
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5">
              {listingMissing && <li>Add at least 1 listing feature, or skip it</li>}
              {showcaseMissing && <li>Add a showcase album with at least {minItemsPerAlbum} photos/videos, or skip it</li>}
              {incompleteAlbums.map((a) => (
                <li key={a.id}>
                  {a.name || "Untitled album"} needs {minItemsPerAlbum - a.media.length} more
                </li>
              ))}
            </ul>
            <button type="button" onClick={onOpenAdvanced} className="mt-2 font-bold underline">
              Go to Listing &amp; Showcase
            </button>
          </div>
        )}

        {!advancedMissing && skippedItems.length > 0 && (
          <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            <Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-bold">Approval may be delayed</strong> — {skippedItems.length} skipped{" "}
              {skippedItems.length === 1 ? "item" : "items"}. See the list on the left.
            </span>
          </p>
        )}

        <div className="h-px bg-gray-100 dark:bg-gray-700" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">Profile strength</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[30px] font-extrabold leading-none text-emerald-700 dark:text-emerald-400">{strength.score}</span>
          <span className="text-[12.5px] font-bold text-gray-600 dark:text-gray-400">/ 100 · {strength.level}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${strength.score}%` }} />
        </div>

        <button
          type="button"
          onClick={onCreate}
          disabled={saving || !canFinalSave}
          className="mt-1 flex min-h-12 w-full items-center justify-center rounded-[10px] bg-emerald-600 text-sm font-bold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08),inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit for review"}
        </button>
      </aside>
    </div>
    </div>
  );
}
