import { BENCH_BANDS, type BenchBand } from './constants';
import { clamp, finite } from './math';
import type {
  BenchVerdict,
  Derived,
  FinancialHealth,
  Metric,
  Model,
  MonthPoint,
  Simulation,
  UnitEconomics,
} from './types';

function metric(value: number | null, reason?: string): Metric {
  if (value === null || !Number.isFinite(value)) {
    return reason ? { value: null, reason } : { value: null };
  }
  return { value };
}

/**
 * LTV methodology: revenue per customer × gross margin ÷ monthly churn.
 * That is the cumulative gross profit a customer generates over an average
 * lifetime of 1 ÷ churn months. Expansion is deliberately excluded so the
 * figure stays conservative and comparable; net retention covers expansion.
 */
export function lifetimeValue(arpu: number, grossMarginPct: number, churnPct: number): Metric {
  const margin = clamp(grossMarginPct / 100, 0, 1);
  const churn = clamp(churnPct / 100, 0, 1);

  if (!(arpu > 0)) return metric(null, 'Revenue per customer is zero, so there is no lifetime value to recover.');
  if (!(margin > 0)) return metric(null, 'At 0% gross margin there is no gross profit to accumulate.');
  if (!(churn > 0)) return metric(null, 'Zero churn means an average lifetime of forever, so LTV is unbounded.');
  return metric((arpu * margin) / churn);
}

/** CAC payback: acquisition cost ÷ monthly gross profit per customer. */
export function cacPayback(cac: Metric, arpu: number, grossMarginPct: number): Metric {
  const margin = clamp(grossMarginPct / 100, 0, 1);
  const grossProfitPerCustomer = arpu * margin;
  if (cac.value === null) return metric(null, cac.reason ?? 'CAC is unknown.');
  if (!(grossProfitPerCustomer > 0)) {
    return metric(null, 'Gross profit per customer is zero, so acquisition cost can never be repaid.');
  }
  return metric(cac.value / grossProfitPerCustomer);
}

function ratio(ltv: Metric, cac: Metric): Metric {
  if (ltv.value === null) return metric(null, ltv.reason ?? 'LTV is unknown.');
  if (cac.value === null) return metric(null, cac.reason ?? 'CAC is unknown.');
  if (cac.value === 0) return metric(null, 'Acquisition is free, so there is no ratio to report.');
  return metric(ltv.value / cac.value);
}

/** Interpolated months until cash runs out. Null means it never does. */
function monthsUntilCashOut(points: MonthPoint[]): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[index - 1];
    if (!current || !previous) break;
    if (current.cash < 0 && previous.cash >= 0) {
      const span = previous.cash - current.cash;
      const fraction = span > 0 ? previous.cash / span : 0;
      return index - 1 + fraction;
    }
  }
  return null;
}

function monthsUntilPositive(points: MonthPoint[]): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point && point.netCashFlow >= 0) return point.month;
  }
  return null;
}

function unitEconomicsFor(model: Model, simulation: Simulation): UnitEconomics {
  const arpu = Math.max(0, finite(model.arpu));
  const margin = clamp(finite(model.grossMarginPct) / 100, 0, 1);
  const cac = simulation.effectiveCac;
  const ltv = lifetimeValue(arpu, model.grossMarginPct, model.monthlyChurnPct);

  return {
    arpu,
    grossProfitPerCustomer: metric(arpu * margin),
    cac,
    ltv,
    ltvToCac: ratio(ltv, cac),
    paybackMonths: cacPayback(cac, arpu, model.grossMarginPct),
  };
}

function healthFor(model: Model, simulation: Simulation): FinancialHealth {
  const today = simulation.points[0];
  const next = simulation.points[1] ?? today;
  const netCashFlow = next?.netCashFlow ?? 0;
  const netBurn = Math.max(0, -netCashFlow);
  const cashOut = monthsUntilCashOut(simulation.points);
  const profitableNow = netCashFlow > 0;

  let runway: Metric;
  if ((today?.cash ?? 0) <= 0) {
    runway = metric(0, 'There is no starting cash to run down.');
  } else if (netCashFlow >= 0) {
    runway = metric(
      null,
      profitableNow
        ? 'Operating cash flow is positive, so cash is not depleting.'
        : 'Operating cash flow is at break-even, so cash is not depleting.',
    );
  } else if (cashOut === null) {
    runway = metric(null, 'Cash lasts beyond the projection: burn falls as revenue grows.');
  } else {
    runway = metric(cashOut);
  }

  const breakEven = breakEvenMrr(model, simulation.effectiveCac);
  const breakEvenMonth = monthsUntilPositive(simulation.points);

  return {
    revenue: next?.revenue ?? 0,
    grossProfit: next?.grossProfit ?? 0,
    smSpend: next?.smSpend ?? 0,
    opex: next?.opex ?? 0,
    netCashFlow,
    netBurn,
    runwayMonths: runway,
    cashOutMonth: cashOut === null ? metric(null, 'Cash never runs out within the projection.') : metric(cashOut),
    breakEvenMrr: breakEven,
    breakEvenCustomers:
      breakEven.value === null
        ? metric(null, breakEven.reason)
        : metric(breakEven.value / Math.max(1e-9, Math.max(0, finite(model.arpu)))),
    monthsToBreakEven: profitableNow
      ? metric(null, 'Already generating positive net cash flow.')
      : breakEvenMonth === null
        ? metric(null, 'Not reached within the projection. Costs keep outpacing gross profit.')
        : metric(breakEvenMonth),
    profitableNow,
  };
}

/**
 * MRR required for net cash flow to reach zero, holding today's assumptions:
 *
 *   MRR × grossMargin − customers × churn × CAC = operating expenses
 *   with customers = MRR ÷ ARPU
 *
 * Expansion is excluded, so this is a floor rather than a forecast.
 */
export function breakEvenMrr(model: Model, cac: Metric): Metric {
  const arpu = Math.max(0, finite(model.arpu));
  const margin = clamp(finite(model.grossMarginPct) / 100, 0, 1);
  const churn = clamp(finite(model.monthlyChurnPct) / 100, 0, 1);
  const opex = Math.max(0, finite(model.monthlyOpex));

  if (arpu <= 0) return metric(null, 'Revenue per customer is zero, so no MRR level covers fixed costs.');
  if (cac.value === null) return metric(null, 'CAC is unknown, so break-even cannot be calculated.');
  if (margin <= 0) return metric(null, 'At 0% gross margin, revenue contributes nothing towards costs.');

  const contributionPerMrr = margin - (churn * cac.value) / arpu;
  if (contributionPerMrr <= 0) {
    return metric(
      null,
      'Not reachable — churn and acquisition costs absorb all gross profit at any scale.',
    );
  }
  return metric(opex / contributionPerMrr);
}

function verdictFor(band: BenchBand, value: number | null): BenchVerdict['status'] {
  if (value === null || !Number.isFinite(value)) return 'na';
  if (band.lowerIsBetter) {
    if (value <= band.good) return 'good';
    return value <= band.ok ? 'ok' : 'weak';
  }
  if (value >= band.good) return 'good';
  return value >= band.ok ? 'ok' : 'weak';
}

function benchmark(
  id: keyof typeof BENCH_BANDS,
  label: string,
  value: Metric,
  formatted: string,
): BenchVerdict {
  const band = BENCH_BANDS[id] as BenchBand;
  return {
    id,
    label,
    value,
    formatted,
    status: verdictFor(band, value.value),
    guidance: band.guidance,
  };
}

/** Everything the dashboard needs, derived from the model plus its simulation. */
export function derive(model: Model, simulation: Simulation): Derived {
  const today = simulation.points[0];
  const next = simulation.points[1] ?? today;
  const unit = unitEconomicsFor(model, simulation);
  const health = healthFor(model, simulation);

  const netRetentionRate = next?.netRetention ?? null;

  return {
    today: today as MonthPoint,
    next: next as MonthPoint,
    unit,
    health,
    mrrGrowth: next?.mrrGrowth ?? null,
    customerGrowth: next?.customerGrowth ?? null,
    netRetention: netRetentionRate,
    benchmarks: [
      benchmark(
        'ltvToCac',
        'LTV : CAC',
        unit.ltvToCac,
        unit.ltvToCac.value === null ? '' : `${unit.ltvToCac.value.toFixed(1)}x`,
      ),
      benchmark('payback', 'CAC payback', unit.paybackMonths, ''),
      benchmark('churn', 'Monthly churn', metric(finite(model.monthlyChurnPct)), ''),
      benchmark('grossMargin', 'Gross margin', metric(finite(model.grossMarginPct)), ''),
      benchmark(
        'netRetention',
        'Net revenue retention',
        netRetentionRate === null ? metric(null) : metric(netRetentionRate * 100),
        '',
      ),
      benchmark(
        'mrrGrowth',
        'MRR growth',
        next?.mrrGrowth === null || next?.mrrGrowth === undefined ? metric(null) : metric(next.mrrGrowth * 100),
        '',
      ),
      benchmark('runway', 'Runway', health.runwayMonths, ''),
    ],
  };
}
