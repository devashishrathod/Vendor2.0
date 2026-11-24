import { useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Landmark,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";
import { CardLabel, Chip, IdCardShell } from "@/components/common/IdCard";
import { KYC_PATHS } from "@/features/onboarding-v2/config/screens";
import { useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";
import KycAddModal from "./KycAddModal";
import RegistrationUpgrade from "./RegistrationUpgrade";

// Formats an ISO date string like "2026-09-01T07:23:19.781Z" → "01 Sept 2026"
function formatDate(isoDate) {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Builds a single-line address from the gst.address object shape
// returned by the real API (buildingNumber, buildingName, location, ...).
const formatGstAddress = (address) => {
  if (!address) return null;
  return (
    address.location ||
    [address.buildingNumber, address.buildingName, address.city, address.district, address.state, address.pin]
      .filter(Boolean)
      .join(", ") ||
    null
  );
};

// White bento tile that holds one of the two card visuals, with its own
// title row and "Verified on" date. A saved PAN / GST is read-only after
// approval — changes go through support (409 DETAIL_ALREADY_PROVIDED).
function CardTile({ title, verified, verifiedAt, className = "", children }) {
  const date = formatDate(verifiedAt);
  return (
    <section className={`flex flex-col rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          {verified && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              {date ? `Verified on ${date}` : "Verified"}
            </p>
          )}
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          <Lock size={11} aria-hidden="true" />
          Changes go through support
        </span>
      </div>
      <div className="flex flex-1 items-center">{children}</div>
    </section>
  );
}

// A PAN / GSTIN the brand doesn't have yet — added once (verify → save).
function AddTile({ title, text, onAdd, className = "" }) {
  return (
    <section className={`flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800 ${className}`}>
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{text}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
      >
        <Plus size={15} aria-hidden="true" />
        Add
      </button>
    </section>
  );
}

// Small label/value bento tile for individual GST details.
function StatTile({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
          <Icon size={14} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-800 break-words dark:text-gray-100">{value || "—"}</p>
    </div>
  );
}

// Trims stray trailing punctuation the GST lookup sometimes returns
// (e.g. "MYNTRA DESIGNS PRIVATE LIMITED,").
const cleanName = (value) => value?.trim().replace(/[,\s]+$/, "") || null;

// ── GST card visual — light emerald ──────────────────────────────────
function GstCardVisual({ gst }) {
  const legalName = cleanName(gst?.legalName);
  const tradeName = cleanName(gst?.tradeName);
  const showTradeName = tradeName && tradeName.toUpperCase() !== legalName?.toUpperCase();
  const isActive = ["SUCCESS", "ACTIVE"].includes(String(gst?.registrationStatus || "").toUpperCase());
  const since = formatDate(gst?.registrationDate);

  return (
    <IdCardShell
      gradient="bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-700 dark:via-gray-700/90 dark:to-emerald-500/25"
      ring="ring-emerald-100 dark:ring-emerald-400/30"
      accent="text-emerald-600 dark:text-emerald-400"
      watermark="GST"
      heading="GST Registration"
      subheading="Goods & Services Tax"
      verified={gst?.isVerified}
    >
      <div className="relative mt-4 flex gap-4">
        <Chip />
        <div className="min-w-0 space-y-3">
          <div>
            <CardLabel>Legal Name</CardLabel>
            <p className="text-sm font-bold uppercase text-gray-900 break-words dark:text-gray-100">
              {legalName || "—"}
            </p>
            {showTradeName && <p className="text-xs text-gray-500 dark:text-gray-400">{tradeName}</p>}
          </div>
          {gst?.registrationStatus && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isActive ? "Active" : gst.registrationStatus}
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardLabel>GSTIN</CardLabel>
          <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.16em] text-gray-950 break-all sm:text-2xl dark:text-white">
            {gst?.gstNumber || "—"}
          </p>
        </div>
        {since && (
          <div className="text-right">
            <CardLabel>Since</CardLabel>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{since}</p>
          </div>
        )}
      </div>
    </IdCardShell>
  );
}

// ── PAN card visual — light sky blue ─────────────────────────────────
// Only the fields the brand API actually returns on brand.pan (pan,
// panType, fullName) are printed; there's no photo/signature data, so
// those areas of a real card are left out rather than faked.
function PanCardVisual({ pan }) {
  return (
    <IdCardShell
      gradient="bg-gradient-to-br from-sky-50 via-white to-indigo-100 dark:from-gray-700 dark:via-gray-700/90 dark:to-sky-500/25"
      ring="ring-sky-100 dark:ring-sky-400/30"
      accent="text-sky-600 dark:text-sky-400"
      watermark="PAN"
      heading="Permanent Account Number"
      subheading="Business PAN Card"
      verified={pan?.isVerified}
    >
      <div className="relative mt-4 flex gap-4">
        <Chip />
        <div className="min-w-0 space-y-3">
          <div>
            <CardLabel>Name</CardLabel>
            <p className="text-sm font-bold uppercase text-gray-900 break-words dark:text-gray-100">
              {cleanName(pan?.fullName) || "—"}
            </p>
          </div>
          {pan?.panType && (
            <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              {pan.panType}
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-5">
        <CardLabel>Permanent Account Number</CardLabel>
        <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.22em] text-gray-950 sm:text-2xl dark:text-white">
          {pan?.pan || "—"}
        </p>
      </div>
    </IdCardShell>
  );
}

/**
 * GstPanSection
 * "Business Profile": GST and PAN as card visuals (read-only once saved —
 * guide §8), an "Add" card for one the brand may still add
 * (`status.editable.kyc.add.{gst,pan}`; NO_GST brands can add GST later),
 * the unregistered → registered upgrade, then GST detail tiles.
 */
const GstPanSection = ({ brand, onUpdated }) => {
  const status = useOnboardingStatusStore((s) => s.status);
  const [adding, setAdding] = useState(null); // null | "PAN" | "GST"
  const gst = brand?.gst ?? null;
  const pan = brand?.pan ?? null;
  const canAdd = status?.editable?.kyc?.add ?? {};
  // UNREGISTERED adds GST through the upgrade card (it switches the path).
  const showAddGst = !gst && canAdd.gst && status?.kycPath !== KYC_PATHS.UNREGISTERED;
  const showAddPan = !pan && canAdd.pan && status?.kycPath !== KYC_PATHS.UNREGISTERED && status?.kycPath !== KYC_PATHS.NO_GST;

  const isActive = ["SUCCESS", "ACTIVE"].includes(String(gst?.registrationStatus || "").toUpperCase());
  const addressLine = formatGstAddress(gst?.address);
  const natureOfBusiness =
    Array.isArray(gst?.natureOfBusiness) && gst.natureOfBusiness.length > 0
      ? gst.natureOfBusiness.join(", ")
      : null;
  const shownCards = [gst || showAddGst, pan || showAddPan].filter(Boolean).length;
  const cardSpan = shownCards === 2 ? "lg:col-span-2" : "lg:col-span-4";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4">
        <RegistrationUpgrade
          brand={brand}
          status={status}
          onAddGst={() => setAdding("GST")}
          onAddPan={() => setAdding("PAN")}
          onChanged={onUpdated}
        />
      </div>

      {!gst && !pan && !showAddGst && !showAddPan && (
        <section className="sm:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">GST &amp; PAN Information</h2>
          </div>
          <p className="mt-2 text-sm text-gray-400">Not available yet.</p>
        </section>
      )}

      {gst && (
        <CardTile title="GST Information" verified={gst.isVerified} verifiedAt={gst.verifiedAt} className={`sm:col-span-2 ${cardSpan}`}>
          <GstCardVisual gst={gst} />
        </CardTile>
      )}
      {showAddGst && (
        <AddTile
          title="GST Information"
          text="Got a GSTIN? Add it once — it's verified and then locked to your brand."
          onAdd={() => setAdding("GST")}
          className={`sm:col-span-2 ${cardSpan}`}
        />
      )}

      {pan && (
        <CardTile title="PAN Information" verified={pan.isVerified} verifiedAt={pan.verifiedAt} className={`sm:col-span-2 ${cardSpan}`}>
          <PanCardVisual pan={pan} />
        </CardTile>
      )}
      {showAddPan && (
        <AddTile
          title="PAN Information"
          text="Add your business PAN once — it's verified and then locked to your brand."
          onAdd={() => setAdding("PAN")}
          className={`sm:col-span-2 ${cardSpan}`}
        />
      )}

      {gst && (
        <>
          <StatTile icon={CalendarDays} label="Registered On" value={formatDate(gst.registrationDate)} />
          <StatTile
            icon={ShieldCheck}
            label="GST Status"
            value={isActive ? "Active" : gst.registrationStatus}
          />
          <StatTile icon={Briefcase} label="Taxpayer Type" value={gst.taxpayerType} />
          <StatTile icon={Building2} label="Constitution" value={gst.constitutionOfBusiness} />
          {addressLine && (
            <StatTile
              icon={MapPin}
              label="Registered Address"
              value={addressLine}
              className="sm:col-span-2"
            />
          )}
          <StatTile
            icon={Landmark}
            label="State Jurisdiction"
            value={gst.stateJurisdiction}
            className={addressLine ? "" : "sm:col-span-2"}
          />
          {natureOfBusiness && (
            <StatTile icon={Store} label="Nature of Business" value={natureOfBusiness} />
          )}
        </>
      )}

      {adding && <KycAddModal type={adding} brandPan={pan?.pan ?? null} onClose={() => setAdding(null)} onSaved={onUpdated} />}
    </div>
  );
};

export default GstPanSection;
