import { useState } from "react";
import { IdCard, Store, Building2, Mail, Phone, PhoneCall, CalendarDays, Tag as TagIcon, MapPin, Copy, Check, ShieldCheck, Info } from "lucide-react";
import { formatMobileNumber } from "../utils/BrandHelpers";
import EmailVerifyModal from "./EmailVerifyModal";
import MobileVerifyModal from "./MobileVerifyModal";

// Formats an ISO date string like "2026-08-15T14:08:09.215Z" → "15 Aug 2026"
const formatJoinedDate = (isoDate) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy"
      title={copied ? "Copied!" : "Copy"}
      className="text-gray-300 hover:text-gray-500 transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function InfoTile({ icon, label, value, copyValue, action, note }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{value || "—"}</p>
          {copyValue && <CopyButton text={copyValue} />}
          {action}
        </div>
        {note}
      </div>
    </div>
  );
}

const BrandProfileSection = ({ profile, outletCount, reload }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  if (!profile) return null;

  const isEmailVerified = !!profile.user?.isEmailVerified;
  // ⚠️ Same caveat as profile.mobile above — isMobileVerified is not
  // independently confirmed from a Postman sample yet; read the same way
  // isEmailVerified already is, per explicit instruction.
  const isMobileVerified = !!profile.user?.isMobileVerified;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <Store className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">General Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your basic information helps us verify and contact you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <InfoTile
          icon={<IdCard className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Merchant ID"
          value={profile.merchantId}
          copyValue={profile.merchantId}
        />
        <InfoTile
          icon={<Store className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Brand Name"
          value={profile.brandName}
          copyValue={profile.brandName}
        />
        <InfoTile
          icon={<Building2 className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Legal Business Name"
          value={profile.legalBusinessName}
          copyValue={profile.legalBusinessName}
        />
        <InfoTile
          icon={<Mail className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Email ID"
          value={profile.email || "Email Not Provided"}
          copyValue={profile.email}
          action={
            isEmailVerified ? (
              <span
                title="Email verified"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 flex-shrink-0"
              >
                <ShieldCheck size={13} />
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0"
              >
                Verify
              </button>
            )
          }
        />
        {/* ⚠️ profile.mobile is NOT independently confirmed from a Postman
            sample for the brand GET response — CreateBrandOutlet.jsx already
            sends `mobile` on brands/update per explicit instruction, so this
            reads it back the same way; verify it displays the real saved
            value once tested. */}
        <InfoTile
          icon={<PhoneCall className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Contact Number"
          value={formatMobileNumber(profile.mobile) || "Not Provided"}
          copyValue={profile.mobile}
          action={
            isMobileVerified ? (
              <span
                title="Mobile verified"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 flex-shrink-0"
              >
                <ShieldCheck size={13} />
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowMobileModal(true)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0"
              >
                Verify
              </button>
            )
          }
        />
        <InfoTile
          icon={<Phone className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="WhatsApp Number"
          value={formatMobileNumber(profile.whatsappNumber)}
          copyValue={profile.whatsappNumber}
        />
        <InfoTile
          icon={<MapPin className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Outlet Count"
          value={outletCount != null ? outletCount : undefined}
          note={
            !outletCount ? (
              <p className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-sky-50 px-2.5 py-1.5 text-[11px] leading-snug text-sky-700">
                <Info size={12} className="flex-shrink-0 mt-0.5" />
                You can add more outlets from Sub Outlets &amp; Franchise section.
              </p>
            ) : null
          }
        />
        <InfoTile
          icon={<TagIcon className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Refer Code"
          value={profile.user?.referralCode}
          copyValue={profile.user?.referralCode}
        />
        <InfoTile
          icon={<CalendarDays className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />}
          label="Joining Date"
          value={formatJoinedDate(profile.joinedDate)}
        />
      </div>

      {showEmailModal && (
        <EmailVerifyModal
          currentEmail={profile.email}
          onClose={() => setShowEmailModal(false)}
          onVerified={async () => {
            await reload?.();
            setShowEmailModal(false);
          }}
        />
      )}

      {showMobileModal && (
        <MobileVerifyModal
          currentMobile={profile.mobile}
          onClose={() => setShowMobileModal(false)}
          onVerified={async () => {
            await reload?.();
            setShowMobileModal(false);
          }}
        />
      )}
    </section>
  );
};

export default BrandProfileSection;
