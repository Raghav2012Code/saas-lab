import { InlineNote, Panel, StatRow } from '../ui/Panel';
import { InfoTip } from '../ui/InfoTip';
import { Pill } from '../ui/Pill';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';

function ComparisonBar({
  label,
  value,
  max,
  display,
  color,
  note,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color: string;
  note?: string;
}) {
  const width = max > 0 ? Math.max(1.5, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        <span className="num text-base text-fg-strong">{display}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      {note ? <span className="text-xs text-subtle">{note}</span> : null}
    </div>
  );
}

/** CAC payback on a months axis, so "5.8 months" has something to sit against. */
function PaybackStrip({ months, display }: { months: number; display: string }) {
  const domain = Math.max(24, Math.ceil(months / 6) * 6);
  const filled = Math.min(100, (months / domain) * 100);
  const ticks = [0, 6, 12, 18, 24].filter((tick) => tick <= domain);
  const target = (12 / domain) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">CAC payback</span>
        <span className="num text-base text-fg-strong">{display}</span>
      </div>
      <div className="relative">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${filled}%`, backgroundColor: 'var(--series-1)' }}
          />
        </div>
        <span
          className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-accent"
          style={{ left: `${target}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="relative h-4">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="num absolute -translate-x-1/2 text-[10px] text-subtle"
            style={{ left: `${(tick / domain) * 100}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
      <p className="text-xs text-subtle">
        Months of gross profit to repay acquisition cost. 12 months is the usual target.
      </p>
    </div>
  );
}

/** What one customer is worth versus what one customer costs. */
export function UnitEconomicsPanel() {
  const { derived, preview, fmt, model } = useModel();
  const live = preview?.derived ?? derived;

  const ltv = live.unit.ltv;
  const cac = live.unit.cac;
  const ratio = live.unit.ltvToCac;
  const payback = live.unit.paybackMonths;

  const max = Math.max(ltv.value ?? 0, cac.value ?? 0);
  const churn = model.monthlyChurnPct / 100;
  const expectedLifetime = churn > 0 ? 1 / churn : null;

  return (
    <Panel
      title="Unit economics"
      description="What a customer is worth against what they cost to win."
      actions={
        <InfoTip label="Unit economics">
          <span className="block font-medium text-fg-strong">Methodology</span>
          <span className="mt-1 block text-muted">
            LTV = ARPU × gross margin ÷ monthly churn, which is the cumulative gross profit over an average
            lifetime of 1 ÷ churn months. Expansion is excluded to keep it conservative.
          </span>
        </InfoTip>
      }
    >
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <ComparisonBar
              label="Lifetime value"
              value={ltv.value ?? 0}
              max={max}
              display={present(ltv, (value) => fmt.money(value)).display}
              color="var(--series-1)"
              note={ltv.reason}
            />
            <ComparisonBar
              label="Cost to acquire"
              value={cac.value ?? 0}
              max={max}
              display={present(cac, (value) => fmt.money(value, 0)).display}
              color="var(--series-2)"
              note={cac.reason ?? (cac.value === 0 ? 'Acquisition is costing you nothing in the model.' : undefined)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="num text-lg text-fg-strong">{present(ratio, (value) => fmt.multiplier(value)).display}</span>
            <Pill tone={ratio.value === null ? 'neutral' : (ratio.value ?? 0) >= 3 ? 'good' : 'warn'}>
              LTV : CAC
            </Pill>
            {ratio.reason ? <InfoTip label="Why this ratio is unavailable">{ratio.reason}</InfoTip> : null}
          </div>

          {payback.value === null ? (
            <InlineNote tone="warn">{payback.reason}</InlineNote>
          ) : (
            <PaybackStrip months={payback.value} display={fmt.months(payback.value)} />
          )}
        </div>

        <div className="divide-y divide-line border-t border-line lg:border-t-0 lg:pt-0">
          <StatRow
            label="Revenue per customer"
            value={`${fmt.money(live.unit.arpu)}/mo`}
            detail="Blended across every plan, and the figure MRR is built from."
          />
          <StatRow
            label="Gross profit per customer"
            value={`${present(live.unit.grossProfitPerCustomer, (value) => fmt.money(value)).display}/mo`}
            detail="Revenue per customer × gross margin. This is what repays CAC."
          />
          <StatRow
            label="Expected lifetime"
            value={expectedLifetime === null ? '\u2014' : fmt.months(expectedLifetime)}
            note="1 ÷ churn"
            detail="With zero churn an average lifetime is unbounded, so this is shown as unavailable."
          />
          <StatRow
            label="Lifetime value"
            value={present(ltv, (value) => fmt.money(value)).display}
            tone="accent"
            strong
          />
          <StatRow
            label="Net revenue retention"
            value={live.netRetention === null ? '\u2014' : fmt.rate(live.netRetention)}
            note="monthly"
            detail={
              live.netRetention === null
                ? 'No opening MRR to compare against yet.'
                : `Annualised, that compounds to ${fmt.rate((1 + live.netRetention) ** 12 - 1)}. It isolates expansion against churn and excludes new customers.`
            }
          />
          <StatRow
            label="Customers churning"
            value={`${fmt.number(live.next.churnedCustomers, 1)}/mo`}
            note={`of ${fmt.number(live.today.customers)}`}
            detail="Logo churn applied to last month's customer count."
          />
        </div>
      </div>
    </Panel>
  );
}
