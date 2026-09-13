import { Crown, CalendarDays, Clock, Hourglass, Tag, Percent, Gift, CreditCard } from 'lucide-react';
import { InfoSection, InfoGrid } from './InfoGrid';
import {
  formatCurrencyINR,
  formatDateDMY,
  getExpirationStatus,
  getDiscountPercentageLabel,
} from '../utils/formatters';

export default function SubscriptionInfo({ subscription }) {
  const {
    planName,
    createdOnDate,
    subscriptionTermYears,
    expirationDate,
    originalPrice,
    discountedPrice,
    paidAmount,
  } = subscription;

  const items = [
    { icon: <Crown className="w-4 h-4" />, iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', label: 'Plan Name', value: planName },
    { icon: <CalendarDays className="w-4 h-4" />, iconBg: 'bg-blue-50', iconText: 'text-blue-500', label: 'Created On', value: formatDateDMY(createdOnDate) },
    { icon: <Clock className="w-4 h-4" />, iconBg: 'bg-gray-100', iconText: 'text-gray-500', label: 'Subscription Term', value: `${subscriptionTermYears} Year${subscriptionTermYears === 1 ? '' : 's'}` },
    { icon: <Hourglass className="w-4 h-4" />, iconBg: 'bg-gray-100', iconText: 'text-gray-500', label: 'Expiration Status', value: getExpirationStatus(expirationDate) },
    { icon: <Tag className="w-4 h-4" />, iconBg: 'bg-blue-50', iconText: 'text-blue-500', label: 'Original Price', value: formatCurrencyINR(originalPrice) },
    { icon: <Percent className="w-4 h-4" />, iconBg: 'bg-rose-50', iconText: 'text-rose-500', label: 'Discounted Price', value: formatCurrencyINR(discountedPrice) },
    { icon: <Gift className="w-4 h-4" />, iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', label: 'Discount Percentage', value: getDiscountPercentageLabel(originalPrice, discountedPrice) },
    { icon: <CreditCard className="w-4 h-4" />, iconBg: 'bg-emerald-50', iconText: 'text-emerald-500', label: 'Paid Amount', value: formatCurrencyINR(paidAmount) },
  ];

  return (
    <InfoSection icon={<Crown className="w-5 h-5" />} title="Subscription Information" subtitle="Key details about your current subscription">
      <InfoGrid items={items} />
    </InfoSection>
  );
}
