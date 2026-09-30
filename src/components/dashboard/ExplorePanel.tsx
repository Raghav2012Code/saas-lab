import { FIELD_SPECS_BY_KEY } from '../../engine/constants';
import type { Formatters } from '../../engine/format';
import type { Derived } from '../../engine/types';
import { activeLevers, leverValue, visibleLevers } from '../../engine/whatIf';
import { pointDelta, relativeDelta, type DeltaText } from '../../lib/delta';
import { formatFieldValue } from '../../lib/field-format';
import { useModel } from '../../state/store';
import { Button } from '../ui/Button';
import { InlineNote, Panel } from '../ui/Panel';
import { DeltaPill } from '../ui/Pill';
import { Slider } from '../ui/Slider';

interface ImpactRow {
  id: string;
  label: string;
  before: number | null;
  after: number | null;
  render: (value: number) => string;
  delta: DeltaText | undefined;
  /** true when a lower number is the better outcome */
  lowerIsBetter?: boolean;
  /** rates compare in percentage points rather than percent */
  rate?: boolean;
}

function buildRows(committed: Derived, next: Derived, fmt: Formatters): ImpactRow[] {
  const money = (value: number) => fmt.money(value);
  const rows: ImpactRow[] = [
    {
      id: 'mrr',
      label: 'MRR',
      before: committed.today.mrr,
      after: next.today.mrr,
      render: money,
      delta: relativeDelta(committed.today.mrr, next.today.mrr, fmt),
    },
    {
      id: 'arr',
      label: 'ARR',
      before: committed.today.arr,
      after: next.today.arr,
      render: money,
      delta: relativeDelta(committed.today.arr, next.today.arr, fmt),
    },
    {
      id: 'customers',
      label: 'Customers',
      before: committed.today.customers,
      after: next.today.customers,
      render: (value) => fmt.number(value),
      delta: relativeDelta(committed.today.customers, next.today.customers, fmt),
    },
    {
      id: 'growth',
      label: 'MRR growth',
      before: committed.mrrGrowth === null ? null : committed.mrrGrowth * 100,
      after: next.mrrGrowth === null ? null : next.mrrGrowth * 100,
      render: (value) => fmt.percent(value, 1),
      delta: pointDelta(
        committed.mrrGrowth === null ? null : committed.mrrGrowth * 100,
        next.mrrGrowth === null ? null : next.mrrGrowth * 100,
        fmt,
      ),
    },
    {
      id: 'ltv',
      label: 'LTV',
      before: committed.unit.ltv.value,
      after: next.unit.ltv.value,
      render: money,
      delta: relativeDelta(committed.unit.ltv.value, next.unit.ltv.value, fmt),
    },
    {
      id: 'ltvCac',
      label: 'LTV : CAC',
      before: committed.unit.ltvToCac.value,
      after: next.unit.ltvToCac.value,
      render: (value) => fmt.multiplier(value),
      delta: relativeDelta(committed.unit.ltvToCac.value, next.unit.ltvToCac.value, fmt),
    },
    {
      id: 'payback',
      label: 'CAC payback',
      before: committed.unit.paybackMonths.value,
      after: next.unit.paybackMonths.value,
      render: (value) => fmt.months(value),
      delta: relativeDelta(committed.unit.paybackMonths.value, next.unit.paybackMonths.value, fmt, false),
      lowerIsBetter: true,
    },
    {
      id: 'grossProfit',
      label: 'Gross profit',
      before: committed.next.grossProfit,
      after: next.next.grossProfit,
      render: money,
      delta: relativeDelta(committed.next.grossProfit, next.next.grossProfit, fmt),
    },
    {
      id: 'netCashFlow',
      label: 'Net cash flow',
      before: committed.health.netCashFlow,
      after: next.health.netCashFlow,
      render: money,
      delta: relativeDelta(committed.health.netCashFlow, next.health.netCashFlow, fmt),
    },
    {
      id: 'runway',
      label: 'Runway',
      before: committed.health.runwayMonths.value,
      after: next.health.runwayMonths.value,
      render: (value) => fmt.months(value),
      delta: relativeDelta(committed.health.runwayMonths.value, next.health.runwayMonths.value, fmt),
    },
    {
      id: 'breakEven',
      label: 'Break-even MRR',
      before: committed.health.breakEvenMrr.value,
      after: next.health.breakEvenMrr.value,
      render: money,
      delta: relativeDelta(committed.health.breakEvenMrr.value, next.health.breakEvenMrr.value, fmt, false),
      lowerIsBetter: true,
    },
  ];

  return rows;
}

/**
 * The what-if surface. Moving a lever re-runs the same engine on a hypothetical
 * model, so what you see here is exactly what you would get if you applied it.
 */
export function ExplorePanel() {
  const { model, levers, setLever, resetLevers, preview, applyPreview, derived, fmt } = useModel();

  const allLevers = visibleLevers(model);
  const active = activeLevers(model, levers);
  const rows = preview ? buildRows(derived, preview.derived, fmt) : [];

  return (
    <Panel
      title="Explore a what-if"
      description="Move a lever and the whole dashboard shows the hypothetical next to your model. Nothing is saved until you apply it."
      actions={
        preview ? (
          <>
            <Button size="sm" variant="primary" onClick={applyPreview}>
              Apply
            </Button>
            <Button size="sm" onClick={resetLevers}>
              Discard
            </Button>
          </>
        ) : (
          <span className="text-xs text-subtle">{allLevers.length} levers</span>
        )
      }
    >
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
        {allLevers.map((lever) => {
          const field = lever.field(model);
          const spec = FIELD_SPECS_BY_KEY[field];
          const value = leverValue(lever, model, levers);
          const baseline = leverValue(lever, model, { [lever.id]: null });
          const effective = lever.kind === 'absolute' ? value : model[field] * value;

          return (
            <Slider
              key={lever.id}
              label={lever.label}
              display={formatFieldValue(spec, effective, fmt)}
              baselineDisplay={formatFieldValue(spec, model[field], fmt) }
              value={value}
              baseline={baseline}
              min={lever.min}
              max={lever.max}
              step={lever.step}
              active={active.some((item) => item.id === lever.id)}
              onChange={(next) => setLever(lever.id, next)}
              onReset={() => setLever(lever.id, null)}
            />
          );
        })}
      </div>

      {rows.length > 0 ? (
        <div className="mt-6 border-t border-line pt-4">
          <h4 className="label-xs pb-1">Impact of this what-if</h4>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[26rem]">
              <caption className="sr-only">
                Comparison of your model against the what-if across key metrics
              </caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col" className="num">
                    Your model
                  </th>
                  <th scope="col" className="num">
                    What if
                  </th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="text-left text-sm font-normal text-muted">
                      {row.label}
                    </th>
                    <td className="num">{row.before === null ? '\u2014' : row.render(row.before)}</td>
                    <td className="num text-fg-strong">{row.after === null ? '\u2014' : row.render(row.after)}</td>
                    <td>
                      {row.delta ? (
                        <DeltaPill
                          value={row.delta.value}
                          text={row.delta.text}
                          higherIsBetter={!row.lowerIsBetter}
                        />
                      ) : (
                        <span className="text-subtle">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-5 border-t border-line pt-4">
          <InlineNote>
            Try “what if churn were 5%?” or “what if I charged 20% more?” — every metric above updates as you
            drag.
          </InlineNote>
        </div>
      )}
    </Panel>
  );
}
