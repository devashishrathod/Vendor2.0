import { Crown, ChevronRight, Store, BarChart3, Tag, Headphones, Network, PieChart, Sparkles } from 'lucide-react';
import { InfoSection } from './InfoGrid';

// `benefits` is a real array of plain benefit strings from the plan
// (sub.plan.benefits, confirmed via the /subscribeds/get response) — the
// icon per benefit is a best-effort visual pick based on the label's
// wording, not a separate confirmed field, so it always falls back to a
// generic sparkle rather than guessing wrong data.
function pickBenefitIcon(label = '') {
  const l = label.toLowerCase();
  if (l.includes('listing')) return Store;
  if (l.includes('visib')) return BarChart3;
  if (l.includes('offer')) return Tag;
  if (l.includes('support')) return Headphones;
  if (l.includes('franchise')) return Network;
  if (l.includes('analytic')) return PieChart;
  return Sparkles;
}

export default function PlanBenefits({ subscription, onViewAll }) {
  const { planName, benefits = [] } = subscription;

  return (
    <InfoSection
      icon={<Crown className="w-5 h-5" />}
      title="Plan Benefits"
      subtitle={`You're getting the best value with ${planName}`}
      action={
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5 whitespace-nowrap"
        >
          View All Benefits <ChevronRight className="w-3 h-3" />
        </button>
      }
    >
      {benefits.length === 0 ? (
        <p className="text-xs text-gray-400">No benefits listed for this plan yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {benefits.map((b) => {
            const Icon = pickBenefitIcon(b);
            return (
              <div key={b} className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-gray-700 leading-snug">{b}</span>
              </div>
            );
          })}
        </div>
      )}
    </InfoSection>
  );
}
