import { LineChart, type LineSeries } from '../charts/LineChart';
import { WaterfallChart } from '../charts/WaterfallChart';
import { InlineNote, Panel, StatRow } from '../ui/Panel';
import { monthLabels } from '../../lib/labels';
import { useModel } from '../../state/store';
import { HorizonControl } from './HorizonControl';

/**
 * Revenue: where MRR has been, where it is going, and exactly which movements
 * make up next month's change.
 */
export function RevenuePanel() {
  const { derived, simulation, preview, fmt, horizon } = useModel();

  const live = preview?.derived ?? derived;
  const liveSimulation = preview?.simulation ?? simulation;
  const points = liveSimulation.points.slice(0, horizon + 1);
  const labels = monthLabels(points);

  const series: LineSeries[] = [
    {
      id: 'mrr',
      label: 'MRR',
      color: 'var(--series-1)',
      values: points.map((point) => point.mrr),
      area: true,
    },
  ];

  if (preview) {
    const previewPoints = preview.simulation.points.slice(0, horizon + 1);
    series.push({
      id: 'mrr-preview',
      label: 'What if',
      color: 'var(--accent)',
      values: previewPoints.map((point) => point.mrr),
      area: false,
      dashed: true,
    });
  }

  const today = live.today;
  const next = live.next;
  const netNewShare = today.mrr > 0 ? next.netNewMrr / today.mrr : null;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Panel
        className="lg:col-span-3"
        title="MRR, month by month"
        description="Fixed assumptions compound: growth slows as churn catches up with acquisition."
        actions={<HorizonControl />}
      >
        <LineChart
          series={series}
          labels={labels}
          ariaLabel={`MRR projection over the next ${horizon} months, from ${fmt.money(today.mrr)} today to ${fmt.money(points[points.length - 1]?.mrr ?? today.mrr)}.`}
          yFormat={(value) => fmt.moneyCompact(value)}
          valueFormat={(value) => fmt.money(value)}
          summaryPrefix="MRR"
        />
      </Panel>

      <Panel className="lg:col-span-2" title="Next month's MRR bridge" description="Where the change comes from.">
        <WaterfallChart
          items={[
            { label: 'Now', value: today.mrr, kind: 'start' },
            { label: 'New', value: next.newMrr, kind: 'delta' },
            { label: 'Expan.', value: next.expansionMrr, kind: 'delta' },
            { label: 'Churn', value: -next.churnedMrr, kind: 'delta' },
            { label: 'Next', value: next.mrr, kind: 'total' },
          ]}
          ariaLabel={`MRR bridge: ${fmt.money(today.mrr)} today, plus ${fmt.money(next.newMrr)} new and ${fmt.money(next.expansionMrr)} expansion, less ${fmt.money(next.churnedMrr)} churned, arriving at ${fmt.money(next.mrr)}.`}
          yFormat={(value) => fmt.moneyCompact(value)}
          valueFormat={(value) => fmt.moneyCompact(value)}
        />

        <div className="mt-3 divide-y divide-line border-t border-line">
          <StatRow label="New MRR" value={fmt.money(next.newMrr)} note="next 30 days" />
          <StatRow label="Expansion MRR" value={fmt.money(next.expansionMrr)} note="next 30 days" />
          <StatRow label="Churned MRR" value={`-${fmt.money(next.churnedMrr)}`} tone="bad" note="next 30 days" />
          <StatRow
            label="Net new MRR"
            value={`${next.netNewMrr >= 0 ? '+' : '-'}${fmt.money(Math.abs(next.netNewMrr))}`}
            tone={next.netNewMrr >= 0 ? 'good' : 'bad'}
            strong
            note={netNewShare === null ? undefined : fmt.rate(netNewShare, 1)}
          />
          <StatRow
            label="ARR"
            value={fmt.money(today.arr)}
            note="today"
            detail="MRR × 12. A run-rate, not a forecast of booked revenue."
          />
        </div>

        {preview ? (
          <div className="mt-3">
            <InlineNote tone="accent">
              The dashed line shows the what-if MRR. Nothing is saved until you apply it.
            </InlineNote>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
