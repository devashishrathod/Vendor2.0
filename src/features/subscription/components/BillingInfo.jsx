import { Building2, MapPin, FileText, CreditCard } from 'lucide-react';
import { InfoSection, InfoTile } from './InfoGrid';

export default function BillingInfo({ subscription }) {
  const { brandName, billingAddress, gstDetails, panDetails } = subscription;

  return (
    <InfoSection icon={<Building2 className="w-5 h-5" />} title="Billing Information" subtitle="Your registered business and tax details">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr_1fr] gap-3">
        <InfoTile icon={<Building2 className="w-4 h-4" />} iconBg="bg-emerald-50" iconText="text-emerald-500" label="Brand Name" value={brandName} />
        <InfoTile icon={<MapPin className="w-4 h-4" />} iconBg="bg-blue-50" iconText="text-blue-500" label="Billing Address" value={billingAddress} />
        <InfoTile icon={<FileText className="w-4 h-4" />} iconBg="bg-emerald-50" iconText="text-emerald-500" label="GST Details" value={gstDetails} />
        <InfoTile icon={<CreditCard className="w-4 h-4" />} iconBg="bg-emerald-50" iconText="text-emerald-500" label="PAN Details" value={panDetails} />
      </div>
    </InfoSection>
  );
}
