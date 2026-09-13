import { Crown } from 'lucide-react';
import { STATIC_TEXT } from '../constants/subscription.constants';

export default function PageHeader({ planTypeLabel }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{STATIC_TEXT.PAGE_TITLE}</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xl">{STATIC_TEXT.PAGE_SUBTITLE}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
          <Crown className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Premium</p>
          <p className="text-base font-bold text-gray-900">{planTypeLabel || 'Plan'}</p>
          <p className="text-xs text-gray-400">More Opportunities</p>
        </div>
      </div>
    </div>
  );
}
