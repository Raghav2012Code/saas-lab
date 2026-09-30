import { SectionHeading } from '../ui/Panel';
import { Advisories } from './Advisories';
import { ExplorePanel } from './ExplorePanel';
import { FinancialHealthPanel } from './FinancialHealthPanel';
import { GrowthPanel } from './GrowthPanel';
import { HeadlineMetrics } from './HeadlineMetrics';
import { RevenuePanel } from './RevenuePanel';
import { UnitEconomicsPanel } from './UnitEconomicsPanel';

const DATE = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

/** The state of the business in one scroll: numbers first, then the why. */
export function OverviewTab() {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SectionHeading
        eyebrow={`Today, ${DATE.format(new Date())}`}
        title="Your SaaS at a glance"
        description="Balances are today. Growth, churn and cash flow describe the next 30 days, and everything is projected from there."
      />

      <Advisories />
      <HeadlineMetrics />
      <RevenuePanel />
      <UnitEconomicsPanel />
      <GrowthPanel />
      <FinancialHealthPanel />
      <ExplorePanel />
    </div>
  );
}
