import React from "react";
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

const BrandProfileSection = ({ profile, onChangeLogo }) => {
  if (!profile) return null;

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-700">
        Brand Profile
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Merchant ID" value={profile.merchantId} />
        <InfoItem label="Brand Name" value={profile.brandName} />
        <InfoItem label="Legal Name" value={profile.legalBusinessName} />
        <InfoItem
          label="Brand Logo"
          value={getLogoFileName(profile.logo) || "No logo uploaded"}
          action={{ label: "Change", onClick: onChangeLogo }}
        />

        <InfoItem label="Mail Id" value={profile.mailId || "Gmail ID Not Provided"} />
        <InfoItem
          label="Mobile No"
          value={formatMobileNumber(profile.whatsappNumber)}
        />
        <InfoItem label="Refer Code" value={profile.user?.referralCode} />
        <InfoItem label="Joining" value={formatJoinedDate(profile.joinedDate)} />
      </div>
    </section>
  );
};

export default BrandProfileSection;