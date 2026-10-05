import { useMemo } from 'react';
import { BarChart, type BarSeries } from '../charts/BarChart';
import { LineChart, type LineSeries } from '../charts/LineChart';
import { InlineNote, Panel, StatRow } from '../ui/Panel';
import { monthLabels } from '../../lib/labels';
import { present } from '../../lib/levers';
import { useSeriesToggle } from '../../hooks/useSeriesToggle';
import { useModel } from '../../state/store';
import { HorizonControl } from './HorizonControl';

/** Cash: the balance, the monthly movement, and the month it runs out. */
export function FinancialHealthPanel() {
  const { derived, simulation, preview, fmt, horizon } = useModel();
  const live = preview?.derived ?? derived;
  const liveSimulation = preview?.simulation ?? simulation;
  const seriesToggle = useSeriesToggle();

  const points = liveSimulation.points.slice(0, horizon + 1);
  const labels = monthLabels(points);
  const health = live.health;

  const cashSeries = useMemo<LineSeries[]>(() => {
    const result: LineSeries[] = [
      {
        id: 'cash',
        label: 'Cash',
        color: 'var(--series-1)',
        values: points.map((point) => point.cash),
        area: true,
      },
    ];

    if (preview) {
      const previewPoints = preview.simulation.points.slice(0, horizon + 1);
      result.push({
        id: 'cash-preview',
        label: 'What if',
        color: 'var(--accent)',
        values: previewPoints.map((point) => point.cash),
        dashed: true,
      });
    }

    return result;
  }, [points, preview, horizon]);

  const netCashFlowBarSeries = useMemo<BarSeries[]>(
    () => [{ id: 'net', label: 'Net cash flow', color: 'var(--series-1)', values: points.slice(1).map((point) => point.netCashFlow) }],
    [points],
  );

  const breakEvenMonth = health.cashOutMonth.value !== null ? health.cashOutMonth.value : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Cash balance"
          description="Starting cash plus every month's net cash flow."
          actions={<HorizonControl />}
        >
          <LineChart
            series={cashSeries}
            labels={labels}
            ariaLabel={`Cash balance projection over ${horizon} months, starting at ${fmt.money(points[0]?.cash ?? 0)}.`}
            includeZero={false}
            yFormat={fmt.moneyCompact}
            valueFormat={fmt.money}
            marker={
              breakEvenMonth !== null && breakEvenMonth <= horizon
                ? { index: Math.round(breakEvenMonth), label: 'cash out' }
                : null
            }
            changeFormat={fmt.moneyCompact}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
          />
        </Panel>

        <Panel title="Net cash flow" description="Gross profit less sales & marketing and operating expenses.">
          <BarChart
            series={netCashFlowBarSeries}
            labels={labels.slice(1)}
            ariaLabel="Net cash flow per month across the projection."
            yFormat={fmt.moneyCompact}
            valueFormat={fmt.money}
            signColors={{ positive: 'var(--success)', negative: 'var(--danger)' }}
            changeFormat={fmt.moneyCompact}
          />
        </Panel>
      </div>

      <Panel title="This month's P&L" description="Where the money goes, in order.">
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
          <div className="divide-y divide-line">
            <StatRow label="Revenue" value={fmt.money(health.revenue)} />
            <StatRow label="Cost of revenue" value={`-${fmt.money(health.revenue - health.grossProfit)}`} tone="muted" />
            <StatRow label="Gross profit" value={fmt.money(health.grossProfit)} strong />
            <StatRow label="Sales & marketing" value={`-${fmt.money(health.smSpend)}`} tone="muted" />
            <StatRow label="Operating expenses" value={`-${fmt.money(health.opex)}`} tone="muted" />
            <StatRow
              label="Net cash flow"
              value={`${health.netCashFlow >= 0 ? '+' : '-'}${fmt.money(Math.abs(health.netCashFlow))}`}
              tone={health.netCashFlow >= 0 ? 'good' : 'bad'}
              strong
            />
          </div>

          <div className="divide-y divide-line">
            <StatRow
              label="Net burn"
              value={`${fmt.money(health.netBurn)}/mo`}
              detail="Zero when the business is cash-flow positive."
            />
            <StatRow
              label="Runway"
              value={
                health.netCashFlow > 0
                  ? 'Profitable'
                  : health.netCashFlow === 0
                    ? 'Break-even'
                    : present(health.runwayMonths, (value) => fmt.months(value)).display
              }
              tone={health.netCashFlow >= 0 ? 'good' : 'default'}
              detail={health.runwayMonths.reason ?? 'Interpolated months until the projected cash balance reaches zero.'}
            />
            <StatRow
              label="Cash runs out"
              value={
                health.cashOutMonth.value === null
                  ? 'Not within the projection'
                  : `Month ${health.cashOutMonth.value.toFixed(0)}`
              }
              detail={health.cashOutMonth.reason ?? 'The first month the projected cash balance goes below zero.'}
            />
            <StatRow
              label="Break-even in"
              value={
                health.monthsToBreakEven.value === null
                  ? 'Not reached'
                  : `Month ${health.monthsToBreakEven.value}`
              }
              detail={health.monthsToBreakEven.reason ?? 'The first month net cash flow turns positive.'}
            />
            <StatRow
              label="Break-even MRR"
              value={present(health.breakEvenMrr, (value) => fmt.money(value)).display}
              detail={
                health.breakEvenMrr.reason ??
                'Steady-state MRR where net cash flow reaches zero, assuming acquisition at replacement rate and no expansion.'
              }
            />
            <StatRow
              label="Break-even customers"
              value={present(health.breakEvenCustomers, (value) => fmt.number(value)).display}
              detail={health.breakEvenCustomers.reason ?? 'Break-even MRR ÷ revenue per customer.'}
            />
          </div>
        </div>

        {health.breakEvenMrr.value === null ? (
          <div className="mt-3 border-t border-line pt-3">
            <InlineNote tone="warn">{health.breakEvenMrr.reason}</InlineNote>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
