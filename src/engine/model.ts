import { MAX_MONTHS } from './constants';
import { clamp, finite, growthRate, safeDiv } from './math';
import type {
  AcquisitionBreakdown,
  Advisory,
  Metric,
  Model,
  MonthPoint,
  NumericField,
  Simulation,
} from './types';

/** Nothing in the model is allowed past this, so charts and formats stay sane. */
const MODEL_CEILING = 1e15;

/** Signups in a month, from the funnel inputs. */
export function monthlySignups(model: Model): number {
  return finite(model.monthlyVisitors) * (finite(model.visitorToSignupPct) / 100);
}

/** New paying customers in a month, from the funnel inputs. */
export function funnelNewCustomers(model: Model): number {
  return monthlySignups(model) * (finite(model.signupToPaidPct) / 100);
}

/** New customers in month 1, however acquisition is configured. */
export function baselineNewCustomers(model: Model): number {
  switch (model.acquisitionMode) {
    case 'funnel':
      return funnelNewCustomers(model);
    case 'direct':
      return Math.max(0, finite(model.monthlyNewCustomers));
    case 'growth': {
      const churn = finite(model.monthlyChurnPct) / 100;
      const expansion = finite(model.monthlyExpansionPct) / 100;
      const target = finite(model.monthlyGrowthPct) / 100;
      const customers = Math.max(0, finite(model.startingCustomers));
      // c₁ = c₀ × (1 + growth) ÷ (1 + expansion); acquisition is the gap above retention.
      const targetCustomers = safeDiv(customers * (1 + target), 1 + expansion) ?? customers;
      return Math.max(0, targetCustomers - customers * (1 - churn));
    }
    default:
      return 0;
  }
}

/**
 * CAC, however it is configured. In 'spend' mode it is spend ÷ month-1 new
 * customers, then held constant for the whole projection so that spend scales
 * with acquisition instead of staying artificially flat.
 */
export function resolveCac(model: Model, newCustomersMonth1: number): Metric {
  if (model.cacMode === 'direct') {
    return { value: Math.max(0, finite(model.cac)) };
  }
  const spend = Math.max(0, finite(model.monthlySmSpend));
  const derived = safeDiv(spend, newCustomersMonth1);
  if (derived === null) {
    return {
      value: null,
      reason: 'No new customers in the first month, so CAC cannot be derived from spend.',
    };
  }
  return { value: derived };
}

/** The input that currently drives new customers, given the acquisition mode. */
export function acquisitionDriverField(model: Model): NumericField {
  switch (model.acquisitionMode) {
    case 'funnel':
      return 'monthlyVisitors';
    case 'direct':
      return 'monthlyNewCustomers';
    default:
      return 'monthlyGrowthPct';
  }
}

/**
 * The input that currently drives CAC. In 'spend' mode CAC is derived, so the
 * lever that actually moves it is the monthly budget.
 */
export function cacDriverField(model: Model): NumericField {
  return model.cacMode === 'spend' ? 'monthlySmSpend' : 'cac';
}

function monthStart(reference: Date, offset: number): string {
  const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + offset, 1));
  return date.toISOString().slice(0, 10);
}

function emptyMonth(month: number, date: string, model: Model): MonthPoint {
  const customers = Math.max(0, finite(model.startingCustomers));
  const arpu = Math.max(0, finite(model.arpu));
  const mrr = customers * arpu;
  const grossMargin = clamp(finite(model.grossMarginPct) / 100, 0, 1);

  return {
    month,
    date,
    customers,
    newCustomers: 0,
    churnedCustomers: 0,
    arpu,
    mrr,
    arr: mrr * 12,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    netNewMrr: 0,
    mrrGrowth: null,
    customerGrowth: null,
    revenue: mrr,
    cogs: mrr * (1 - grossMargin),
    grossProfit: mrr * grossMargin,
    smSpend: 0,
    opex: 0,
    netCashFlow: 0,
    cash: Math.max(0, finite(model.startingCash)),
    netRetention: null,
  };
}

/**
 * The one simulation. Runs `months` forward from today and returns every month
 * with the full P&L, balance and retention detail. Deterministic: the same
 * model always produces the same numbers.
 */
export function simulate(model: Model, months: number = MAX_MONTHS, reference = new Date()): Simulation {
  const horizon = clamp(Math.round(finite(months, MAX_MONTHS)), 1, MAX_MONTHS);

  const churn = clamp(finite(model.monthlyChurnPct) / 100, 0, 1);
  const expansion = clamp(finite(model.monthlyExpansionPct) / 100, 0, 1);
  const grossMargin = clamp(finite(model.grossMarginPct) / 100, 0, 1);
  const opexGrowth = clamp(finite(model.opexGrowthPct) / 100, -1, 1);
  const growthTarget = finite(model.monthlyGrowthPct) / 100;

  const points: MonthPoint[] = [emptyMonth(0, monthStart(reference, 0), model)];

  let customers = Math.max(0, finite(model.startingCustomers));
  let arpuPrevious = Math.max(0, finite(model.arpu));
  let cash = Math.max(0, finite(model.startingCash));
  let effectiveCac: Metric = { value: null, reason: 'Not computed.' };
  let breakdownSignups = 0;
  let breakdownPaid = 0;

  for (let month = 1; month <= horizon; month += 1) {
    const arpu = arpuPrevious * (1 + expansion);

    const churnedCustomers = customers * churn;

    let newCustomers: number;
    if (model.acquisitionMode === 'funnel') {
      newCustomers = funnelNewCustomers(model);
    } else if (model.acquisitionMode === 'direct') {
      newCustomers = Math.max(0, finite(model.monthlyNewCustomers));
    } else {
      const targetMrr = customers * arpuPrevious * (1 + growthTarget);
      const targetCustomers = safeDiv(targetMrr, arpu) ?? customers;
      newCustomers = Math.max(0, targetCustomers - (customers - churnedCustomers));
    }

    if (month === 1) {
      effectiveCac = resolveCac(model, newCustomers);
      breakdownPaid = newCustomers;
      breakdownSignups = model.acquisitionMode === 'funnel' ? monthlySignups(model) : newCustomers;
    }

    const nextCustomers = Math.min(MODEL_CEILING, Math.max(0, customers - churnedCustomers + newCustomers));
    const mrr = Math.min(MODEL_CEILING, nextCustomers * arpu);
    const previousMrr = points[month - 1]?.mrr ?? 0;

    const newMrr = newCustomers * arpu;
    const expansionMrr = customers * (arpu - arpuPrevious);
    const churnedMrr = churnedCustomers * arpu;
    const netNewMrr = newMrr + expansionMrr - churnedMrr;

    const smSpend =
      effectiveCac.value === null
        ? Math.max(0, finite(model.monthlySmSpend))
        : Math.max(0, newCustomers * effectiveCac.value);

    const revenue = mrr;
    const opex = Math.min(MODEL_CEILING, Math.max(0, finite(model.monthlyOpex) * (1 + opexGrowth) ** month));
    const grossProfit = revenue * grossMargin;
    const netCashFlow = grossProfit - smSpend - opex;
    cash = Math.min(MODEL_CEILING, cash + netCashFlow);

    const point: MonthPoint = {
      month,
      date: monthStart(reference, month),
      customers: nextCustomers,
      newCustomers,
      churnedCustomers,
      arpu,
      mrr,
      arr: mrr * 12,
      newMrr,
      expansionMrr,
      churnedMrr,
      netNewMrr,
      mrrGrowth: previousMrr > 0 ? growthRate(mrr, previousMrr) : null,
      customerGrowth: customers > 0 ? growthRate(nextCustomers, customers) : null,
      revenue,
      cogs: revenue * (1 - grossMargin),
      grossProfit,
      smSpend,
      opex,
      netCashFlow,
      cash,
      netRetention: previousMrr > 0 ? safeDiv(previousMrr + expansionMrr - churnedMrr, previousMrr) : null,
    };

    points.push(point);
    customers = nextCustomers;
    arpuPrevious = arpu;
  }

  const breakdown: AcquisitionBreakdown = {
    signups: breakdownSignups,
    paid: breakdownPaid,
    newMrr: breakdownPaid * (points[1]?.arpu ?? arpuPrevious),
  };

  return {
    points,
    effectiveCac,
    breakdown,
    advisories: buildAdvisories(model, points, effectiveCac),
  };
}

/**
 * Plain-language notes about assumptions that make a metric undefined or
 * misleading. Surfaced in the UI instead of letting a number lie.
 */
function buildAdvisories(model: Model, points: MonthPoint[], effectiveCac: Metric): Advisory[] {
  const advisories: Advisory[] = [];
  const first = points[1];
  if (!first) return advisories;

  const churn = finite(model.monthlyChurnPct) / 100;
  const expansion = finite(model.monthlyExpansionPct) / 100;
  const grossMargin = finite(model.grossMarginPct) / 100;
  const arpu = Math.max(0, finite(model.arpu));

  if (first.newCustomers <= 0) {
    advisories.push({
      id: 'no-acquisition',
      severity: 'warn',
      title:
        model.acquisitionMode === 'growth'
          ? 'The growth target sits below the churn floor, so new customers are zero and MRR falls.'
          : 'These assumptions produce no new customers, so nothing compounds.',
    });
  }

  if (churn === 0) {
    advisories.push({
      id: 'no-churn',
      severity: 'info',
      title: 'Zero churn: LTV is unbounded and retention metrics are not meaningful.',
    });
  } else if (churn > 0.15) {
    advisories.push({
      id: 'high-churn',
      severity: 'warn',
      title: `${(churn * 100).toFixed(0)}% monthly churn means the average customer stays about ${(1 / churn).toFixed(1)} months.`,
    });
  }

  if (grossMargin <= 0) {
    advisories.push({
      id: 'no-margin',
      severity: 'warn',
      title: 'At 0% gross margin there is no gross profit, so revenue cannot cover any costs.',
    });
  }

  if (arpu <= 0) {
    advisories.push({
      id: 'no-arpu',
      severity: 'warn',
      title: 'Revenue per customer is zero, so MRR stays at zero however many customers you add.',
    });
  }

  const cac = effectiveCac.value;
  if (cac !== null && cac > 0 && churn > 0) {
    const ltv = (arpu * grossMargin) / churn;
    if (ltv < cac) {
      advisories.push({
        id: 'negative-unit-economics',
        severity: 'warn',
        title: 'Acquiring a customer costs more than their lifetime gross profit, so growth consumes cash.',
      });
    }
  }

  if (cac !== null && arpu > 0) {
    const contribution = grossMargin - (churn * cac) / arpu;
    if (contribution <= 0) {
      advisories.push({
        id: 'no-break-even',
        severity: 'warn',
        title: 'Break-even is unreachable: churn and acquisition costs absorb all gross profit at any scale.',
      });
    }
  }

  if (effectiveCac.value === null && model.cacMode === 'spend') {
    advisories.push({
      id: 'cac-undefined',
      severity: 'info',
      title: `CAC cannot be derived, so sales & marketing stays flat at the entered monthly spend.`,
    });
  }

  if (expansion > 0 && churn > 0 && expansion > churn) {
    advisories.push({
      id: 'net-negative-churn',
      severity: 'info',
      title: 'Expansion outweighs churn, so the existing customer base grows in revenue terms each month.',
    });
  }

  const hitsCeiling = points.some((point) => point.mrr >= MODEL_CEILING);
  if (hitsCeiling) {
    advisories.push({
      id: 'ceiling',
      severity: 'info',
      title: 'Values hit the model ceiling — check whether these assumptions are realistic.',
    });
  }

  return advisories;
}
