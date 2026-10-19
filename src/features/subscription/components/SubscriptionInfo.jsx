import { Crown, Clock, Hourglass, Tag, Percent } from 'lucide-react';
import { CardLabel, Chip, IdCardShell } from '@/components/common/IdCard';
import { InfoSection, InfoTile } from './InfoGrid';
import { PLAN_STATUS } from '../constants/subscription.constants';
import {
  formatCurrencyINR,
  formatDateDMY,
  getExpirationStatus,
  getDiscountPercentageLabel,
} from '../utils/formatters';

const STATUS_PILL = {
  [PLAN_STATUS.ACTIVE]: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  [PLAN_STATUS.TRIAL]: { label: 'Trial', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', dot: 'bg-sky-500' },
  [PLAN_STATUS.EXPIRED]: { label: 'Expired', className: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
  [PLAN_STATUS.CANCELLED]: { label: 'Cancelled', className: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
};

// Gold "membership card" for the current plan — same card family as the
// GST/PAN cards on Account Information (shared IdCardShell).
function PlanCard({ subscription }) {
  const { status, planName, planTypeLabel, brandName, createdOnDate, expirationDate, originalPrice, discountedPrice, paidAmount } =
    subscription;
  const pill = STATUS_PILL[status] || STATUS_PILL[PLAN_STATUS.ACTIVE];
  const hasDiscount = originalPrice > 0 && discountedPrice < originalPrice;

  return (
    <IdCardShell
      gradient="bg-gradient-to-br from-amber-50 via-white to-orange-100 dark:from-gray-700 dark:via-gray-700/90 dark:to-emerald-500/25"
      ring="ring-amber-100 dark:ring-emerald-400/30"
      accent="text-amber-600 dark:text-emerald-400"
      watermark="PLAN"
      heading="Trydood Subscription"
      subheading={planTypeLabel}
      verified={status === PLAN_STATUS.ACTIVE || status === PLAN_STATUS.TRIAL}
    >
      <div className="relative mt-4 flex gap-4">
        <Chip />
        <div className="min-w-0 space-y-3">
          <div>
            <CardLabel>Plan</CardLabel>
            <p className="text-xl font-extrabold capitalize text-gray-900 dark:text-gray-100">{planName}</p>
          </div>
          <div>
            <CardLabel>Member</CardLabel>
            <p className="text-sm font-bold uppercase text-gray-900 break-words dark:text-gray-100">{brandName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pill.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
              {pill.label}
            </span>
            {hasDiscount && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                {getDiscountPercentageLabel(originalPrice, discountedPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardLabel>Valid</CardLabel>
          <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-gray-950 dark:text-white">
            {formatDateDMY(createdOnDate)} → {formatDateDMY(expirationDate)}
          </p>
        </div>
        <div className="text-right">
          <CardLabel>Paid</CardLabel>
          <p className="text-lg font-extrabold text-gray-950 dark:text-white">{formatCurrencyINR(paidAmount)}</p>
        </div>
      </div>
    </IdCardShell>
  );
}

/**
 * Subscription Information — bento grid: the plan card (2×2) on the left,
 * four detail tiles beside it. Plan name, dates, discount % and paid amount
 * are printed on the card itself, so they aren't repeated as tiles.
 */
export default function SubscriptionInfo({ subscription }) {
  const { subscriptionTerm, expirationDate, originalPrice, discountedPrice } = subscription;

  const tiles = [
    { icon: <Clock className="w-4 h-4" />, iconBg: 'bg-gray-100 dark:bg-gray-600', iconText: 'text-gray-500', label: 'Subscription Term', value: subscriptionTerm },
    { icon: <Hourglass className="w-4 h-4" />, iconBg: 'bg-amber-50 dark:bg-amber-500/10', iconText: 'text-amber-500', label: 'Expiration Status', value: getExpirationStatus(expirationDate) },
    { icon: <Tag className="w-4 h-4" />, iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconText: 'text-blue-500', label: 'Original Price', value: formatCurrencyINR(originalPrice) },
    { icon: <Percent className="w-4 h-4" />, iconBg: 'bg-rose-50 dark:bg-rose-500/10', iconText: 'text-rose-500', label: 'Discounted Price', value: formatCurrencyINR(discountedPrice) },
  ];

  return (
    <InfoSection icon={<Crown className="w-5 h-5" />} title="Subscription Information" subtitle="Key details about your current subscription">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:row-span-2">
          <PlanCard subscription={subscription} />
        </div>
        {tiles.map((tile) => (
          <InfoTile key={tile.label} {...tile} className="h-full items-center" />
        ))}
      </div>
    </InfoSection>
  );
}
