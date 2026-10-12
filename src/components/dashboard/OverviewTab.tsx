import { SectionHeading } from '../ui/Panel';
import { useModel } from '../../state/store';
import { Advisories } from './Advisories';
import { ExplorePanel } from './ExplorePanel';
import { FinancialHealthPanel } from './FinancialHealthPanel';
import { GoalSeekPanel } from './GoalSeekPanel';
import { GrowthPanel } from './GrowthPanel';
import { HeadlineMetrics } from './HeadlineMetrics';
import { PresetStrip } from './PresetStrip';
import { RevenuePanel } from './RevenuePanel';
import { UnitEconomicsPanel } from './UnitEconomicsPanel';

const DATE = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

/** The state of the business in one scroll: numbers first, then the why. */
export function OverviewTab() {
  const { isDefault } = useModel();
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SectionHeading
        eyebrow={`Opened ${DATE.format(new Date())}`}
        title="Your SaaS at a glance"
        description="Balances are today. Growth, churn and cash flow describe the next 30 days, and everything is projected from there."
      />

      {isDefault ? <PresetStrip /> : null}
      <Advisories />
      <HeadlineMetrics />
      <RevenuePanel />
      <UnitEconomicsPanel />
      <GrowthPanel />
      <FinancialHealthPanel />
      <ExplorePanel />
      <GoalSeekPanel />
    </div>
  );
}
