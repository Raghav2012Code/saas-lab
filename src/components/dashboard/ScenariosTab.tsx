import { useState } from 'react';

import { LineChart, type LineSeries } from '../charts/LineChart';
import { useSeriesToggle } from '../../hooks/useSeriesToggle';
import { Icon } from '../ui/Icon';
import { InlineNote, Panel, SectionHeading } from '../ui/Panel';
import { Pill } from '../ui/Pill';
import { cx } from '../../lib/cx';
import { monthLabels } from '../../lib/labels';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';
import type { Formatters } from '../../engine/format';
import type { Model, ScenarioResult } from '../../engine/types';
import { HorizonControl } from './HorizonControl';

const COLORS: Record<string, string> = {
  conservative: 'var(--series-4)',
  base: 'var(--series-1)',
  aggressive: 'var(--series-3)',
};

interface Row {
  id: string;
  label: string;
  detail: string;
  value: (result: ScenarioResult, endIndex: number) => string;
}

/**
 * Three futures from one set of assumptions. The purpose is to show how the
 * assumptions move the outcome — not to recommend one.
 */
export function ScenariosTab() {
  const { scenarios, fmt, horizon, model } = useModel();
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const seriesToggle = useSeriesToggle();
  const base = scenarios.find((entry) => entry.id === 'base');

  const rows: Row[] = [
    {
      id: 'mrr',
      label: `MRR in month ${horizon}`,
      detail: 'Recurring revenue at the end of the projection.',
      value: (result, endIndex) => fmt.money(result.simulation.points[endIndex]?.mrr ?? 0),
    },
    {
      id: 'arr',
      label: `ARR in month ${horizon}`,
      detail: 'MRR at the end of the projection × 12.',
      value: (result, endIndex) => fmt.money(result.simulation.points[endIndex]?.arr ?? 0),
    },
    {
      id: 'customers',
      label: `Customers in month ${horizon}`,
      detail: 'Customer count at the end of the projection.',
      value: (result, endIndex) => fmt.number(result.simulation.points[endIndex]?.customers ?? 0),
    },
    {
      id: 'netNew',
      label: 'Net new MRR, final month',
      detail: 'New plus expansion, less churned MRR in the last projected month.',
      value: (result, endIndex) => fmt.money(result.simulation.points[endIndex]?.netNewMrr ?? 0),
    },
    {
      id: 'growth',
      label: 'MRR growth, final month',
      detail: 'Month-over-month growth at the end of the projection.',
      value: (result, endIndex) => {
        const point = result.simulation.points[endIndex];
        const growth = point?.mrrGrowth;
        return growth === null || growth === undefined ? '\u2014' : fmt.rate(growth);
      },
    },
    {
      id: 'nrr',
      label: 'Net revenue retention',
      detail: 'Expansion versus churn on the existing base, in the final month.',
      value: (result, endIndex) => {
        const point = result.simulation.points[endIndex];
        const retention = point?.netRetention;
        return retention === null || retention === undefined ? '\u2014' : fmt.rate(retention);
      },
    },
    {
      id: 'ltvCac',
      label: 'LTV : CAC',
      detail: 'Lifetime gross profit per customer against acquisition cost.',
      value: (result) => present(result.derived.unit.ltvToCac, (value) => fmt.multiplier(value)).display,
    },
    {
      id: 'payback',
      label: 'CAC payback',
      detail: 'Months of gross profit to repay acquisition cost.',
      value: (result) => present(result.derived.unit.paybackMonths, (value) => fmt.months(value)).display,
    },
    {
      id: 'margin',
      label: 'Gross margin',
      detail: 'Cost of revenue as a share of revenue.',
      value: (result) => fmt.percent(result.model.grossMarginPct),
    },
    {
      id: 'churn',
      label: 'Monthly churn',
      detail: 'Customer churn applied in this scenario.',
      value: (result) => fmt.percent(result.model.monthlyChurnPct),
    },
    {
      id: 'cash',
      label: `Cash in month ${horizon}`,
      detail: 'Projected cash balance at the end of the projection.',
      value: (result, endIndex) => fmt.money(result.simulation.points[endIndex]?.cash ?? 0),
    },
    {
      id: 'runway',
      label: 'Runway',
      detail: 'Months until cash reaches zero at the projected burn.',
      value: (result) =>
        result.derived.health.profitableNow
          ? 'Profitable'
          : present(result.derived.health.runwayMonths, (value) => fmt.months(value)).display,
    },
    {
      id: 'breakEven',
      label: 'Break-even reached',
      detail: 'The month net cash flow first turns positive.',
      value: (result) => present(result.derived.health.monthsToBreakEven, (value) => `Month ${value}`).display,
    },
  ];

  const endIndex = Math.min(horizon, base?.simulation.points.length ? base.simulation.points.length - 1 : horizon);
  const labels = monthLabels(scenarios[0]?.simulation.points.slice(0, horizon + 1) ?? []);

  const seriesFor = (key: 'mrr' | 'cash'): LineSeries[] =>
    scenarios.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      color: COLORS[scenario.id] ?? 'var(--series-1)',
      values: scenario.simulation.points.slice(0, horizon + 1).map((point) => point[key]),
      area: scenario.id === 'base',
    }));

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SectionHeading

        title="How the same model behaves under different assumptions"
        description="Conservative and aggressive are stated multipliers, not a second model. Neither is a recommendation — the point is to see which assumptions actually move the outcome."
        actions={<HorizonControl />}
      />

      <Panel
        title={`Comparison at month ${horizon}`}
        description="Your assumptions, then the same model with acquisition and retention shifted."
        flush
      >
        <div className="overflow-x-auto">
          <table className="data-table min-w-[34rem]">
            <caption className="sr-only">Metric comparison across conservative, base and aggressive scenarios</caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                {scenarios.map((scenario) => (
                  <th key={scenario.id} scope="col" className={cx('num', hoveredColumn === scenario.id && 'col-active')}
                    onPointerEnter={() => setHoveredColumn(scenario.id)}
                    onPointerLeave={() => setHoveredColumn(null)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[scenario.id] }}
                        aria-hidden="true"
                      />
                      {scenario.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const values = scenarios.map((scenario) => row.value(scenario, endIndex));
                const numeric = values.map((value) => {
                  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
                  // Non-numeric answers ("—", "Profitable") must not be ranked.
                  return /[0-9]/.test(value) && Number.isFinite(parsed) ? parsed : null;
                });
                const comparable = numeric.filter((value): value is number => value !== null);
                const best = comparable.length > 0 ? Math.max(...comparable) : null;
                const worst = comparable.length > 0 ? Math.min(...comparable) : null;
                const spread = best !== null && worst !== null && best !== worst;
                return (
                  <tr key={row.id} onPointerEnter={() => setHoveredRow(row.id)} onPointerLeave={() => setHoveredRow(null)}>
                    <th scope="row" className={cx(hoveredRow === row.id && 'row-active')}>
                      {row.label}
                      <span className="block text-xs font-normal text-subtle">{row.detail}</span>
                    </th>
                    {scenarios.map((scenario, index) => {
                      const value = values[index];
                      const number = numeric[index];
                      const isHigh = spread && number !== null && number === best;
                      const isLow = spread && number !== null && number === worst;
                      return (
                        <td
                          key={scenario.id}
                          className={cx(
                            'num',
                            hoveredColumn === scenario.id && 'col-active',
                            hoveredRow === row.id && 'row-active',
                            isHigh ? 'text-fg-strong' : isLow ? 'text-subtle' : '',
                          )}
                        >
                          {value}
                          {isHigh ? <span className="pl-1 text-xs text-muted">high</span> : null}
                          {isLow ? <span className="pl-1 text-xs text-subtle">low</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="MRR by scenario" description="The same compounding, three ways.">
          <LineChart
            series={seriesFor('mrr')}
            labels={labels}
            ariaLabel="MRR projection compared across conservative, base and aggressive assumptions."
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
          />
        </Panel>
        <Panel title="Cash by scenario" description="Where each set of assumptions leaves the bank balance.">
          <LineChart
            series={seriesFor('cash')}
            labels={labels}
            ariaLabel="Cash balance compared across conservative, base and aggressive assumptions."
            includeZero={false}
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <Panel
            key={scenario.id}
            title={
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[scenario.id] }}
                  aria-hidden="true"
                />
                {scenario.label}
              </span>
            }
            description={scenario.description}
          >
            {scenario.changes.length === 0 ? (
              <InlineNote>Your assumptions, unchanged.</InlineNote>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {scenario.changes.map((change) => (
                  <li key={change.field} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-sm text-muted">{change.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="num text-sm text-fg">
                        {formatScenarioValue(scenario.model, change.field, fmt)}
                      </span>
                      <Pill tone="neutral">{change.display}</Pill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="flex items-start gap-1.5 text-xs text-muted">
                <Icon name="info" size={12} />
                <span>
                  {scenario.derived.health.profitableNow
                    ? 'Cash-flow positive from the first projected month.'
                    : `Cash runs out ${
                        scenario.derived.health.cashOutMonth.value === null
                          ? 'beyond the projection.'
                          : `around month ${scenario.derived.health.cashOutMonth.value.toFixed(0)}.`
                      }`}
                </span>
              </p>
            </div>
          </Panel>
        ))}
      </div>

      <p className="text-xs text-muted">
        Presets are applied to your base model every time it changes, so they always describe the same
        relative shift. Base MRR today is {fmt.money(base?.derived.today.mrr ?? 0)} (
        {fmt.money(base?.derived.today.arr ?? 0)} ARR), driven by {describeAcquisition(model)}.
      </p>
    </div>
  );
}

function describeAcquisition(model: Model): string {
  if (model.acquisitionMode === 'funnel') return 'the funnel you entered';
  if (model.acquisitionMode === 'direct') return 'a flat number of new customers each month';
  return 'a target MRR growth rate';
}

function formatScenarioValue(model: Model, field: string, fmt: Formatters): string {
  const value = (model as unknown as Record<string, number>)[field] ?? 0;
  if (field === 'startingCash' || field === 'startingCustomers') return '';
  if (field === 'monthlyVisitors' || field === 'monthlyNewCustomers') return fmt.number(value);
  if (field === 'monthlyOpex' || field === 'monthlySmSpend' || field === 'cac' || field === 'arpu') {
    return fmt.money(value);
  }
  return fmt.percent(value);
}
