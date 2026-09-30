import { FunnelChart, type FunnelStage } from '../charts/FunnelChart';
import { InlineNote, Panel, StatRow } from '../ui/Panel';
import { InfoTip } from '../ui/InfoTip';
import { useModel } from '../../state/store';

const MODE_NOTE: Record<string, string> = {
  direct: 'New customers are entered as a flat number each month, so the funnel is not in play. Switch to Funnel in the assumptions rail to model visitors and conversion.',
  growth: 'New customers are solved backwards from a target MRR growth rate, so they are an output rather than an input. Switch to Funnel in the assumptions rail to model visitors and conversion.',
};

/** How customers arrive, and how well they stay. */
export function GrowthPanel() {
  const { model, derived, preview, fmt, simulation } = useModel();
  const live = preview?.derived ?? derived;
  const liveSimulation = preview?.simulation ?? simulation;
  const breakdown = liveSimulation.breakdown;
  const acquisitionSpend = liveSimulation.points[1]?.smSpend ?? 0;

  const stages: FunnelStage[] = [
    {
      id: 'visitors',
      label: 'Monthly visitors',
      value: model.monthlyVisitors,
      formatted: fmt.number(model.monthlyVisitors),
    },
    {
      id: 'signups',
      label: 'Signups',
      value: breakdown.signups,
      formatted: fmt.number(breakdown.signups, 1),
      note: `${fmt.percent(model.visitorToSignupPct)} of visitors`,
    },
    {
      id: 'paid',
      label: 'New paying customers',
      value: breakdown.paid,
      formatted: fmt.number(breakdown.paid, 1),
      note: `${fmt.percent(model.signupToPaidPct)} of signups`,
    },
  ];

  const annualisedRetention =
    live.netRetention === null ? null : (1 + live.netRetention) ** 12 - 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        title={model.acquisitionMode === 'funnel' ? 'Acquisition funnel' : 'How customers arrive'}
        description="Top of the funnel down to revenue."
      >
        {model.acquisitionMode === 'funnel' ? (
          <>
            <FunnelChart
              stages={stages}
              ariaLabel={`Funnel: ${fmt.number(model.monthlyVisitors)} visitors become ${fmt.number(breakdown.signups, 1)} signups, which become ${fmt.number(breakdown.paid, 1)} paying customers a month.`}
            />
            <div className="mt-3 divide-y divide-line border-t border-line">
              <StatRow
                label="Visitors per paying customer"
                value={fmt.number(
                  breakdown.paid > 0 ? model.monthlyVisitors / breakdown.paid : 0,
                  1,
                )}
                detail="How much traffic one customer costs. Lower is a better funnel."
              />
              <StatRow
                label="Cost per visitor"
                value={
                  model.monthlyVisitors > 0 ? fmt.money(acquisitionSpend / model.monthlyVisitors, 2) : '\u2014'
                }
              />
              <StatRow
                label="Cost per signup"
                value={breakdown.signups > 0 ? fmt.money(acquisitionSpend / breakdown.signups, 0) : '\u2014'}
                detail="Sales & marketing spend divided by signups, so you can see where the cost actually lands."
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted">
                {model.acquisitionMode === 'direct' ? 'New customers' : 'Target MRR growth'}
              </span>
              <span className="num text-lg text-fg-strong">
                {model.acquisitionMode === 'direct'
                  ? `${fmt.number(model.monthlyNewCustomers)}/mo`
                  : `${fmt.percent(model.monthlyGrowthPct)}/mo`}
              </span>
            </div>
            <InlineNote>{MODE_NOTE[model.acquisitionMode]}</InlineNote>
            <div className="mt-2 divide-y divide-line border-t border-line">
              <StatRow label="New customers" value={`${fmt.number(live.next.newCustomers, 1)}/mo`} />
              <StatRow label="Sales & marketing" value={`${fmt.money(live.next.smSpend)}/mo`} />
              <StatRow
                label="Cost to acquire"
                value={live.unit.cac.value === null ? '\u2014' : fmt.money(live.unit.cac.value)}
                detail={live.unit.cac.reason ?? 'Monthly acquisition spend divided by new customers.'}
              />
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Retention and rates" description="The multipliers behind every projection.">
        <div className="divide-y divide-line">
          {model.acquisitionMode === 'funnel' ? (
            <>
              <StatRow label="Visitor to signup" value={fmt.percent(model.visitorToSignupPct)} />
              <StatRow label="Signup to paid" value={fmt.percent(model.signupToPaidPct)} />
              <StatRow
                label="Visitor to paid"
                value={fmt.percent(
                  (model.visitorToSignupPct / 100) * (model.signupToPaidPct / 100) * 100,
                )}
                note="both steps"
              />
            </>
          ) : null}
          <StatRow label="New customers" value={`${fmt.number(live.next.newCustomers, 1)}/mo`} />
          <StatRow label="Monthly churn" value={fmt.percent(model.monthlyChurnPct)} tone="bad" />
          <StatRow label="Customer retention" value={fmt.rate(1 - model.monthlyChurnPct / 100)} />
          <StatRow
            label="Expansion"
            value={`${fmt.percent(model.monthlyExpansionPct)}/mo`}
            detail="Raises ARPU from the customers you already have; it never adds customers."
          />
          <StatRow
            label="Net revenue retention"
            value={live.netRetention === null ? '\u2014' : fmt.rate(live.netRetention)}
            note="monthly"
            detail={
              annualisedRetention === null
                ? undefined
                : `Compounds to ${fmt.rate(annualisedRetention)} a year. Above 100% the existing base grows on its own.`
            }
          />
          <StatRow
            label="MRR growth"
            value={live.mrrGrowth === null ? '\u2014' : fmt.rate(live.mrrGrowth)}
            note="next month"
            detail={
              live.mrrGrowth === null || live.mrrGrowth <= 0
                ? undefined
                : `Sustainable for a year, that would compound to ${fmt.rate((1 + live.mrrGrowth) ** 12 - 1)}.`
            }
          />
          <StatRow
            label="Customer growth"
            value={live.customerGrowth === null ? '\u2014' : fmt.rate(live.customerGrowth)}
            note="next month"
          />
        </div>

        <div className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-xs text-muted">
          <InfoTip label="Where growth flattens">
            <span className="block font-medium text-fg-strong">Growth flattens where acquisition meets churn</span>
            <span className="mt-1 block text-muted">
              {model.monthlyChurnPct > 0
                ? `At ${fmt.number(live.next.newCustomers, 1)} new customers a month against ${fmt.percent(model.monthlyChurnPct)} churn, customers settle near ${fmt.number(live.next.newCustomers / (model.monthlyChurnPct / 100))}. Adding customers faster than that needs a bigger funnel or better retention.`
                : 'With zero churn, customers never stop accumulating.'}
            </span>
          </InfoTip>
          <span>
            {model.monthlyChurnPct > 0
              ? `Customers settle near ${fmt.number(live.next.newCustomers / (model.monthlyChurnPct / 100))} if nothing else changes.`
              : 'With zero churn, customers accumulate forever.'}
          </span>
        </div>
      </Panel>
    </div>
  );
}
