import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { LineChart, type LineSeries } from '../charts/LineChart';
import { assumptionRows } from '../../lib/export-model';
import { monthLabels } from '../../lib/labels';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { Tile, TileGrid } from './shared';

/**
 * One self-contained snapshot page: the eight headline figures, the MRR
 * projection and the assumptions behind them. Every figure uses the same
 * store data and the same `present`/fmt helpers as the dashboard, so the
 * numbers cannot disagree. Printed via the browser (Print / Save as PDF).
 */
export function SnapshotView({ onClose }: { onClose: () => void }) {
  const { model, derived, simulation, preview, fmt, horizon } = useModel();
  const dialog = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Same expressions as HeadlineMetrics: committed model values, so the
  // snapshot always matches the dashboard's main figures.
  const mrrGrowth = derived.mrrGrowth;
  const ltvToCac = present(derived.unit.ltvToCac, (value) => fmt.multiplier(value));
  const payback = present(derived.unit.paybackMonths, (value) => fmt.months(value));
  const runway = present(derived.health.runwayMonths, (value) => fmt.months(value));
  const runwayWord =
    derived.health.netCashFlow > 0 ? 'Profitable' : derived.health.netCashFlow === 0 ? 'Break-even' : undefined;

  const figures: { label: string; value: string; note?: string }[] = [
    { label: 'MRR', value: fmt.money(derived.today.mrr), note: 'today' },
    { label: 'ARR', value: fmt.money(derived.today.arr), note: 'MRR × 12' },
    { label: 'Customers', value: fmt.number(derived.today.customers), note: 'today' },
    { label: 'MRR growth', value: mrrGrowth === null ? '—' : fmt.rate(mrrGrowth), note: 'month over month' },
    { label: 'LTV : CAC', value: ltvToCac.display },
    { label: 'CAC payback', value: payback.display },
    { label: 'Gross margin', value: fmt.percent(model.grossMarginPct) },
    { label: 'Runway', value: runwayWord ?? runway.display },
  ];

  // Same series shape as RevenuePanel: MRR with the what-if as a dashed overlay.
  const points = simulation.points.slice(0, horizon + 1);
  const labels = monthLabels(points);
  const today = derived.today;
  const series: LineSeries[] = [
    { id: 'mrr', label: 'MRR', color: 'var(--series-1)', values: points.map((point) => point.mrr), area: true },
  ];
  if (preview) {
    series.push({
      id: 'mrr-preview',
      label: 'What if',
      color: 'var(--accent)',
      values: preview.simulation.points.slice(0, horizon + 1).map((point) => point.mrr),
      dashed: true,
    });
  }

  const rows = assumptionRows(model, fmt);
  const stamp = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-title"
      tabIndex={-1}
      className="snapshot-view fixed inset-0 z-50 overflow-y-auto bg-bg outline-none"
    >
      <div className="snapshot-page mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-xs">Snapshot · {stamp}</p>
            <h2 id="snapshot-title" className="text-lg font-semibold text-fg-strong">
              Snapshot summary
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Headline figures, the {horizon}-month MRR projection and the assumptions behind them.
            </p>
          </div>
          <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <section aria-label="Headline figures" className="snapshot-figures">
          <TileGrid>
            {figures.map((figure) => (
              <Tile key={figure.label}>
                <div className="py-3">
                  <p className="label-xs">{figure.label}</p>
                  <p className="num mt-0.5 text-lg font-medium text-fg-strong">{figure.value}</p>
                  {figure.note ? <p className="mt-0.5 text-xs text-subtle">{figure.note}</p> : null}
                </div>
              </Tile>
            ))}
          </TileGrid>
        </section>

        <Panel
          title="MRR projection"
          description="The same settings carried forward each month: growth slows as leaving customers catch up with new ones."
        >
          <LineChart
            series={series}
            labels={labels}
            ariaLabel={`MRR projection over the next ${horizon} months, from ${fmt.money(today.mrr)} today to ${fmt.money(points[points.length - 1]?.mrr ?? today.mrr)}.`}
            height={180}
            yFormat={(value) => fmt.moneyCompact(value)}
            valueFormat={(value) => fmt.money(value)}
            changeFormat={(value) => fmt.moneyCompact(value)}
          />
        </Panel>

        <Panel title="Assumptions" description="Every input, exactly as entered.">
          <table className="data-table data-table-text">
            <caption className="sr-only">Assumptions behind this snapshot</caption>
            <thead>
              <tr>
                <th scope="col">Assumption</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="num">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            Projection length: <span className="num text-fg">{horizon} months</span>
          </p>
        </Panel>
      </div>
    </div>,
    document.body,
  );
}
