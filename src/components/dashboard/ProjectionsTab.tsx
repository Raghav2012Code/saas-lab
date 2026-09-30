import { LineChart, type LineSeries } from '../charts/LineChart';
import { StatTile } from '../ui/StatTile';
import { useState } from 'react';

import { useSeriesToggle } from '../../hooks/useSeriesToggle';
import { Panel, SectionHeading } from '../ui/Panel';
import { monthLabels } from '../../lib/labels';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';
import { HorizonControl } from './HorizonControl';
import { ProjectionTable } from './ProjectionTable';
import { Tile, TileGrid } from './shared';

/** Forward view: the same model, projected, with nothing smoothed or guessed. */
export function ProjectionsTab() {
  const { simulation, derived, preview, fmt, horizon, model } = useModel();
  // A single focused month, shared by the charts and the table, so hovering
  // either one traces the other.
  // Two independent links between the table and the charts: hovering a row moves
  // the chart crosshair, and hovering a chart highlights the row. Keeping them in
  // separate state stops each one overriding the other.
  const [rowHover, setRowHover] = useState<number | null>(null);
  const [chartHover, setChartHover] = useState<number | null>(null);
  const seriesToggle = useSeriesToggle();

  const live = preview?.derived ?? derived;
  const liveSimulation = preview?.simulation ?? simulation;
  const full = liveSimulation.points;
  const points = full.slice(0, horizon + 1);
  const labels = monthLabels(points);
  const end = points.at(-1) ?? live.today;
  const today = live.today;

  const cashMarker = live.health.cashOutMonth.value;

  const revenue = points.map((point) => point.revenue);
  const costs = points.map((point) => point.cogs + point.smSpend + point.opex);

  const previewPoints = preview ? preview.simulation.points.slice(0, horizon + 1) : null;
  const overlays = (
    key: 'mrr' | 'customers' | 'cash' | 'netCashFlow',
    committed: (number | null)[],
  ): LineSeries[] => {
    const base: LineSeries = {
      id: key,
      label: key === 'customers' ? 'Customers' : key === 'cash' ? 'Cash' : 'MRR',
      color: 'var(--series-1)',
      values: committed,
      area: key !== 'customers',
    };
    if (!previewPoints) return [base];
    return [
      base,
      {
        id: `${key}-preview`,
        label: 'What if',
        color: 'var(--accent)',
        values: previewPoints.map((point) => point[key]),
        dashed: true,
      },
    ];
  };

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SectionHeading

        title={`The next ${horizon} months`}
        description="Straight-line compounding of the assumptions you entered. No smoothing, no best case."
        actions={<HorizonControl />}
      />

      <TileGrid>
        <Tile>
          <StatTile
            label={`MRR in month ${horizon}`}
            size="lg"
            display={fmt.money(end.mrr)}
            previewDisplay={previewPoints ? fmt.money(previewPoints[horizon]?.mrr ?? end.mrr) : null}
            copyValue={fmt.money(end.mrr)}
            caption={`from ${fmt.money(today.mrr)} today`}
          />
        </Tile>
        <Tile>
          <StatTile
            label={`ARR in month ${horizon}`}
            display={fmt.money(end.arr)}
            previewDisplay={previewPoints ? fmt.money(previewPoints[horizon]?.arr ?? end.arr) : null}
            copyValue={fmt.money(end.arr)}
          />
        </Tile>
        <Tile>
          <StatTile
            label={`Customers in month ${horizon}`}
            display={fmt.number(end.customers)}
            previewDisplay={previewPoints ? fmt.number(previewPoints[horizon]?.customers ?? end.customers) : null}
            copyValue={String(end.customers)}
            caption={`from ${fmt.number(today.customers)} today`}
          />
        </Tile>
        <Tile>
          <StatTile
            label="Cash at the end"
            display={fmt.money(end.cash)}
            previewDisplay={previewPoints ? fmt.money(previewPoints[horizon]?.cash ?? end.cash) : null}
            copyValue={fmt.money(end.cash)}
            word={end.cash < 0 ? 'In deficit' : undefined}
            caption={
              end.cash < 0 && !previewPoints
                ? `cash runs out around month ${cashMarker === null ? '—' : cashMarker.toFixed(0)}`
                : undefined
            }
          />
        </Tile>
      </TileGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="MRR"
          description="Recurring revenue, compounding monthly."
        >
          <LineChart
            series={overlays('mrr', points.map((point) => point.mrr))}
            labels={labels}
            ariaLabel={`MRR from ${fmt.money(today.mrr)} today to ${fmt.money(end.mrr)} in month ${horizon}.`}
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
            externalIndex={rowHover}
            onIndexChange={setChartHover}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
            marker={live.health.monthsToBreakEven.value !== null && live.health.monthsToBreakEven.value <= horizon ? { index: live.health.monthsToBreakEven.value, label: 'break-even' } : null}
          />
        </Panel>

        <Panel title="Customers" description="New customers minus churn, every month.">
          <LineChart
            series={overlays('customers', points.map((point) => point.customers)).map((seriesItem) => ({
              ...seriesItem,
              area: false,
            }))}
            labels={labels}
            ariaLabel={`Customers from ${fmt.number(today.customers)} today to ${fmt.number(end.customers)} in month ${horizon}.`}
            yFormat={(value) => fmt.numberCompact(value)}
            valueFormat={(value) => fmt.number(value)}
            changeFormat={(value) => fmt.numberCompact(value)}
            externalIndex={rowHover}
            onIndexChange={setChartHover}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
          />
        </Panel>

        <Panel
          title="Revenue against total costs"
          description="Cost of revenue, sales & marketing and operating expenses combined."
        >
          <LineChart
            series={[
              {
                id: 'revenue',
                label: 'Revenue',
                color: 'var(--series-1)',
                values: revenue,
                area: true,
              },
              {
                id: 'costs',
                label: 'Total costs',
                color: 'var(--series-4)',
                values: costs,
              },
            ]}
            labels={labels}
            ariaLabel={`Revenue reaching ${fmt.money(end.revenue)} against total costs of ${fmt.money(costs[costs.length - 1] ?? 0)} in month ${horizon}.`}
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
            externalIndex={rowHover}
            onIndexChange={setChartHover}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
          />
        </Panel>

        <Panel title="Cash balance" description="The month the balance turns negative is marked.">
          <LineChart
            series={overlays('cash', points.map((point) => point.cash))}
            labels={labels}
            ariaLabel={`Cash balance from ${fmt.money(points[0]?.cash ?? 0)} today to ${fmt.money(end.cash)} in month ${horizon}.`}
            includeZero={false}
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
            externalIndex={rowHover}
            onIndexChange={setChartHover}
            hiddenSeries={seriesToggle.hidden}
            onToggleSeries={seriesToggle.toggle}
            marker={
              cashMarker !== null && cashMarker <= horizon
                ? { index: Math.round(cashMarker), label: 'cash out' }
                : null
            }
          />
        </Panel>
      </div>

      <Panel
        title="Month by month"
        description="Raw numbers, so you can check any row against the rest of the model."
        flush
      >
        <ProjectionTable
          points={points}
          cashOutMonth={cashMarker}
          breakEvenMonth={live.health.monthsToBreakEven.value}
          linkedIndex={chartHover}
          onHoverIndex={setRowHover}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <p className="text-xs text-muted">
            Cumulative net cash flow over {horizon} months:{' '}
            <span className={`num ${(end.cash - today.cash) >= 0 ? 'text-success' : 'text-danger'}`}>
              {(end.cash - today.cash) >= 0 ? '+' : '-'}
              {fmt.money(Math.abs(end.cash - today.cash))}
            </span>
          </p>
          <p className="text-xs text-muted">
            Gross margin {fmt.percent(model.grossMarginPct)} · churn {fmt.percent(model.monthlyChurnPct)}
          </p>
        </div>
      </Panel>

      <p className="text-xs text-muted">
        Break-even is projected for{' '}
        <span className="num text-fg">{present(live.health.monthsToBreakEven, (value) => `month ${value}`).display}</span>
        {live.health.breakEvenMrr.value !== null
          ? `, at ${fmt.money(live.health.breakEvenMrr.value)} MRR.`
          : '.'}{' '}
        {live.health.breakEvenMrr.reason ?? ''}
      </p>
    </div>
  );
}
