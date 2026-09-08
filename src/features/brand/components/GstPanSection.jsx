import { useState } from "react";
import { FileText, IdCard, ChevronDown, CheckCircle2 } from "lucide-react";
import InfoItem from "./InfoItem";

// Formats an ISO date string like "2026-09-01T07:23:19.781Z" → "01 Sept 2026"
function formatDate(isoDate) {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Same "Verified / Verified on {date}" pill used on the Brand header —
// only shown when the real isVerified flag is true.
function VerifiedBadge({ verifiedAt }) {
  const date = formatDate(verifiedAt);
  return (
    <div className="flex flex-col items-start gap-0.5 rounded-md bg-emerald-50 px-4 py-2 flex-shrink-0">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 size={14} />
        Verified
      </span>
      {date && <span className="text-[11px] text-gray-400">Verified on {date}</span>}
    </div>
  );
}

// Read-only, expand/collapse card shell shared by the GST and PAN cards
// below — no edit affordance, since this is verification data pulled
// straight from the confirmed provider response.
function InfoCard({ icon, title, subtitle, verified, verifiedAt, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {verified && <VerifiedBadge verifiedAt={verifiedAt} />}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>
      </div>

      {!collapsed && <div className="mt-5 rounded-xl border border-gray-100 p-5">{children}</div>}
    </section>
  );
}

// Builds a single-line address from the gst.address object shape
// returned by the real API (buildingNumber, buildingName, location, ...).
const formatGstAddress = (address) => {
  if (!address) return "—";
  return (
    address.location ||
    [address.buildingNumber, address.buildingName, address.city, address.state, address.pin]
      .filter(Boolean)
      .join(", ")
  );
};

function GstCard({ gst }) {
  const address = gst?.address;
  return (
    <InfoCard
      icon={
        <FileText className="w-5 h-5 text-emerald-500" strokeWidth={1.8} />
      }
      title="GST Information"
      subtitle="Your business's registered GST details."
      verified={gst?.isVerified}
      verifiedAt={gst?.verifiedAt}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem label="GSTIN" value={gst?.gstNumber || "—"} />
        <InfoItem label="Legal Name" value={gst?.legalName || "—"} />
        <InfoItem label="Trade Name" value={gst?.tradeName || "—"} />
        <InfoItem label="Constitution of Business" value={gst?.constitutionOfBusiness || "—"} />
        <InfoItem label="Taxpayer Type" value={gst?.taxpayerType || "—"} />
        <InfoItem label="Registration Status" value={gst?.registrationStatus || "—"} />
        <InfoItem label="Registration Date" value={formatDate(gst?.registrationDate) || "—"} />
        <div className="sm:col-span-2 lg:col-span-3">
          <InfoItem label="State Jurisdiction" value={gst?.stateJurisdiction || "—"} />
        </div>
      </div>

      {Array.isArray(gst?.natureOfBusiness) && gst.natureOfBusiness.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Nature of Business
          </p>
          <div className="flex flex-wrap gap-2">
            {gst.natureOfBusiness.map((item) => (
              <span
                key={item}
                className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {address && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Registered Address
          </p>
          <p className="text-sm text-gray-800 mb-4">{formatGstAddress(address)}</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Building Number" value={address.buildingNumber || "—"} />
            <InfoItem label="Building Name" value={address.buildingName || "—"} />
            <InfoItem label="City" value={address.city || "—"} />
            <InfoItem label="District" value={address.district || "—"} />
            <InfoItem label="State" value={address.state || "—"} />
            <InfoItem label="PIN Code" value={address.pin || "—"} />
            <InfoItem label="Country" value={address.country || "—"} />
          </div>
        </div>
      )}
    </InfoCard>
  );
}

function PanCard({ pan }) {
  return (
    <InfoCard
      icon={<IdCard className="w-5 h-5 text-emerald-500" strokeWidth={1.8} />}
      title="PAN Information"
      subtitle="Your business's registered PAN details."
      verified={pan?.isVerified}
      verifiedAt={pan?.verifiedAt}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem label="PAN" value={pan?.pan || "—"} />
        <InfoItem label="PAN Type" value={pan?.panType || "—"} />
        <InfoItem label="Full Name" value={pan?.fullName || "—"} />
      </div>
    </InfoCard>
  );
}

/**
 * GstPanSection
 * gst and pan are separate top-level fields on the brand object
 * (brand.gst, brand.pan) in the real API — there is no single combined
 * "gstPanInformation" object. Rendered as two separate, independently
 * expand/collapse-able, read-only cards — GST first, PAN below it.
 */
const GstPanSection = ({ gst, pan }) => {
  if (!gst && !pan) {
    return (
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-emerald-500" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-bold text-gray-900">GST &amp; PAN Information</h2>
        </div>
        <p className="mt-2 text-sm text-gray-400">Not available yet.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {gst && <GstCard gst={gst} />}
      {pan && <PanCard pan={pan} />}
    </div>
  );
};

export default GstPanSection;
