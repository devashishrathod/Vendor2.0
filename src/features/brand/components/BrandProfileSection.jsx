import { useState } from "react";
import { X } from "lucide-react";
import InfoItem from "./InfoItem";
import { formatMobileNumber } from "../utils/BrandHelpers";

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

// Pulls just the filename out of a Cloudinary/asset URL for display,
// e.g. ".../upload/f_auto,q_auto/v1/Images/r2fftyqdrtasikjwdfz8?_a=..." → "r2fftyqdrtasikjwdfz8"
const getLogoFileName = (logoUrl) => {
  if (!logoUrl) return null;
  try {
    const path = logoUrl.split("?")[0];
    return path.substring(path.lastIndexOf("/") + 1);
  } catch {
    return null;
  }
};

const BrandProfileSection = ({ profile, onChangeLogo, logoUpdating }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!profile) return null;

  const logoActions = [
    ...(profile.logo
      ? [{ label: "View", onClick: () => setPreviewOpen(true) }]
      : []),
    { label: logoUpdating ? "Uploading…" : "Change", onClick: onChangeLogo, disabled: logoUpdating },
  ];

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">Brand Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your brand's core identity and contact details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Merchant ID" value={profile.merchantId} />
        <InfoItem label="Brand Name" value={profile.brandName} />
        <InfoItem label="Legal Name" value={profile.legalBusinessName} />
        <InfoItem
          label="Brand Logo"
          value={getLogoFileName(profile.logo) || "No logo uploaded"}
          actions={logoActions}
        />

        <InfoItem label="Mail Id" value={profile.mailId || "Gmail ID Not Provided"} />
        <InfoItem
          label="Mobile No"
          value={formatMobileNumber(profile.whatsappNumber)}
        />
        <InfoItem label="Refer Code" value={profile.user?.referralCode} />
        <InfoItem label="Joining" value={formatJoinedDate(profile.joinedDate)} />
      </div>

      {previewOpen && profile.logo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close"
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={22} />
            </button>
            <img
              src={profile.logo}
              alt="Brand logo"
              className="max-h-[70vh] w-full rounded-2xl bg-white object-contain p-4"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default BrandProfileSection;