import { StatTile, type BenchmarkBadge } from '../ui/StatTile';
import { pointDelta, relativeDelta } from '../../lib/delta';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';
import { Tile, TileGrid } from './shared';

/**
 * The top-level summary. Eight numbers that answer "how is this business doing?"
 * before any chart is read.
 */
export function HeadlineMetrics() {
  const { derived, preview, fmt, model } = useModel();

  // "Now" values always come from the committed model; the what-if only supplies
  // the ghost value and the delta. The benchmark badge reflects what is on screen.
  const live = preview?.derived ?? derived;
  const pv = preview?.derived;

  const badges = new Map(live.benchmarks.map((bench) => [bench.id, bench]));
  const badge = (id: string): BenchmarkBadge | undefined => {
    const found = badges.get(id);
    return found ? { status: found.status, guidance: found.guidance } : undefined;
  };

  const mrrGrowth = derived.mrrGrowth;
  const customerGrowth = derived.customerGrowth;
  const ltvToCac = present(derived.unit.ltvToCac, (value) => fmt.multiplier(value));
  const payback = present(derived.unit.paybackMonths, (value) => fmt.months(value));
  const runway = present(derived.health.runwayMonths, (value) => fmt.months(value));

  const wordFor = (health: { netCashFlow: number }): string | undefined =>
    health.netCashFlow > 0 ? 'Profitable' : health.netCashFlow === 0 ? 'Break-even' : undefined;

  const runwayWord = wordFor(derived.health);
  const previewLtvToCac = pv ? present(pv.unit.ltvToCac, (value) => fmt.multiplier(value)).display : null;
  const previewPayback = pv ? present(pv.unit.paybackMonths, (value) => fmt.months(value)).display : null;
  const previewRunway = pv
    ? (wordFor(pv.health) ?? present(pv.health.runwayMonths, (value) => fmt.months(value)).display)
    : null;

  return (
    <TileGrid>
      <Tile>
        <StatTile
          label="MRR"
          size="lg"
          display={fmt.money(derived.today.mrr)}
          previewDisplay={pv ? fmt.money(pv.today.mrr) : null}
          copyValue={fmt.money(derived.today.mrr)}
          delta={
            mrrGrowth === null
              ? undefined
              : { value: mrrGrowth, text: fmt.rate(mrrGrowth, 1) }
          }
          previewDelta={relativeDelta(derived.today.mrr, pv?.today.mrr, fmt)}
          caption="next 30 days"
          detail={
            <>
              <span className="block font-medium text-fg-strong">Monthly recurring revenue today</span>
              <span className="mt-1 block text-muted">
                Customers × blended revenue per customer. The badge compares the model you have saved with
                the what-if you are exploring.
              </span>
            </>
          }
        />
      </Tile>

      <Tile>
        <StatTile
          label="ARR"
          display={fmt.money(derived.today.arr)}
          previewDisplay={pv ? fmt.money(pv.today.arr) : null}
          copyValue={fmt.money(derived.today.arr)}
          previewDelta={relativeDelta(derived.today.arr, pv?.today.arr, fmt)}
          caption="MRR × 12"
        />
      </Tile>

      <Tile>
        <StatTile
          label="Customers"
          size="lg"
          display={fmt.number(derived.today.customers)}
          previewDisplay={pv ? fmt.number(pv.today.customers) : null}
          copyValue={String(derived.today.customers)}
          delta={
            customerGrowth === null
              ? undefined
              : { value: customerGrowth, text: fmt.rate(customerGrowth, 1) }
          }
          previewDelta={relativeDelta(derived.today.customers, pv?.today.customers, fmt)}
          caption="next 30 days"
        />
      </Tile>

      <Tile>
        <StatTile
          label="MRR growth"
          display={mrrGrowth === null ? '\u2014' : fmt.rate(mrrGrowth)}
          previewDisplay={pv && pv.mrrGrowth !== null ? fmt.rate(pv.mrrGrowth) : null}
          copyValue={mrrGrowth === null ? '' : fmt.rate(mrrGrowth)}
          reason={
            mrrGrowth === null ? 'MRR is zero today, so there is no growth rate to compare against.' : undefined
          }
          benchmark={badge('mrrGrowth')}
          previewDelta={
            pv && mrrGrowth !== null && pv.mrrGrowth !== null
              ? pointDelta(mrrGrowth * 100, pv.mrrGrowth * 100, fmt)
              : undefined
          }
          caption="month over month"
        />
      </Tile>

      <Tile>
        <StatTile
          label="LTV : CAC"
          size="lg"
          display={ltvToCac.display}
          previewDisplay={previewLtvToCac}
          copyValue={ltvToCac.display}
          reason={ltvToCac.reason}
          benchmark={badge('ltvToCac')}
          previewDelta={relativeDelta(
            derived.unit.ltvToCac.value,
            pv?.unit.ltvToCac.value ?? null,
            fmt,
          )}
        />
      </Tile>

      <Tile>
        <StatTile
          label="CAC payback"
          display={payback.display}
          previewDisplay={previewPayback}
          copyValue={payback.display}
          reason={payback.reason}
          benchmark={badge('payback')}
          previewDelta={relativeDelta(
            derived.unit.paybackMonths.value,
            pv?.unit.paybackMonths.value ?? null,
            fmt,
            false,
          )}
        />
      </Tile>

      <Tile>
        <StatTile
          label="Gross margin"
          display={fmt.percent(model.grossMarginPct)}
          previewDisplay={preview ? fmt.percent(preview.model.grossMarginPct) : null}
          copyValue={fmt.percent(model.grossMarginPct)}
          benchmark={badge('grossMargin')}
          previewDelta={
            preview
              ? pointDelta(model.grossMarginPct, preview.model.grossMarginPct, fmt)
              : undefined
          }
          caption={`gross profit ${fmt.moneyCompact((pv ?? derived).next.grossProfit)}/mo`}
        />
      </Tile>

      <Tile>
        <StatTile
          label="Runway"
          display={runway.display}
          word={runwayWord}
          previewDisplay={previewRunway}
          copyValue={runwayWord ?? runway.display}
          reason={runwayWord ? undefined : runway.reason}
          benchmark={badge('runway')}
          previewDelta={relativeDelta(
            derived.health.runwayMonths.value,
            pv?.health.runwayMonths.value ?? null,
            fmt,
          )}
          caption={
            (pv ?? derived).health.profitableNow
              ? 'cash flow is positive'
              : `net burn ${fmt.moneyCompact((pv ?? derived).health.netBurn)}/mo`
          }
        />
      </Tile>
    </TileGrid>
  );
}
