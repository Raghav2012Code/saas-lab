import { describe, expect, it } from 'vitest';

import { DEFAULT_MODEL, FIELD_SPECS, MAX_MONTHS } from './constants';
import { createFormatters } from './format';
import { baselineNewCustomers, simulate } from './model';
import { derive } from './metrics';
import { normalizeModel, parseNumericInput } from './validate';
import { applyPreset, describeChanges } from './scenarios';
import { decodeModel, encodeModel } from './share';
import { applyLevers, EMPTY_LEVERS, type LeverValues } from './whatIf';
import { projectionCsv } from './export';
import type { Model, MonthPoint, Simulation } from './types';

const REFERENCE = new Date(Date.UTC(2026, 0, 15));

function model(overrides: Partial<Model> = {}): Model {
  return normalizeModel({ ...DEFAULT_MODEL, ...overrides });
}

function run(overrides: Partial<Model> = {}, months = MAX_MONTHS): Simulation {
  return simulate(model(overrides), months, REFERENCE);
}

/** Model, simulation and derived metrics together, so they can never disagree. */
function analyzeModel(built: Model) {
  const simulation = simulate(built, MAX_MONTHS, REFERENCE);
  return { model: built, simulation, derived: derive(built, simulation) };
}

function analyze(overrides: Partial<Model> = {}) {
  return analyzeModel(model(overrides));
}

function at(simulation: Simulation, month: number): MonthPoint {
  const point = simulation.points[month];
  if (!point) throw new Error(`No point at month ${month}`);
  return point;
}

function everyNumber(point: MonthPoint): number[] {
  return Object.values(point).flatMap((value) => (typeof value === 'number' ? [value] : []));
}

describe('default model', () => {
  it('describes a believable business out of the box', () => {
    const simulation = run();
    const today = at(simulation, 0);

    expect(today.customers).toBe(420);
    expect(today.mrr).toBeCloseTo(24_780, 6);
    expect(today.arr).toBeCloseTo(297_360, 6);
    expect(simulation.points).toHaveLength(MAX_MONTHS + 1);
  });

  it('grows with a fixed funnel and eventually plateaus at churn ÷ acquisition', () => {
    const simulation = run({ monthlyExpansionPct: 0 });
    const month12 = at(simulation, 12);
    const month36 = at(simulation, 36);

    expect(month12.mrr).toBeGreaterThan(at(simulation, 0).mrr);
    // 42 new customers a month against 3.2% churn tops out near 1,312 customers.
    expect(month36.customers).toBeLessThan(42 / 0.032 + 1);
    expect(month36.customers).toBeGreaterThan(month12.customers);
  });

  it('reports a finite runway and a cash-out month that agree with each other', () => {
    const { derived } = analyze();
    expect(derived.health.runwayMonths.value).toBeGreaterThan(0);
    expect(derived.health.cashOutMonth.value).toBeCloseTo(derived.health.runwayMonths.value as number, 6);
    expect(derived.health.profitableNow).toBe(false);
  });
});

describe('internal consistency', () => {
  it('keeps net new MRR equal to the change in MRR for every month', () => {
    const simulation = run();
    for (let index = 1; index < simulation.points.length; index += 1) {
      const previous = at(simulation, index - 1);
      const current = at(simulation, index);
      expect(current.mrr - previous.mrr).toBeCloseTo(current.netNewMrr, 4);
    }
  });

  it('reconciles new, expansion and churned MRR against ARR', () => {
    const simulation = run();
    const current = at(simulation, 6);
    expect(current.arr).toBeCloseTo(current.mrr * 12, 6);
    expect(current.newMrr + current.expansionMrr - current.churnedMrr).toBeCloseTo(current.netNewMrr, 6);
  });

  it('keeps the cash balance equal to starting cash plus cumulative cash flow', () => {
    const simulation = run();
    let cumulative = DEFAULT_MODEL.startingCash;
    for (let index = 1; index < simulation.points.length; index += 1) {
      cumulative += at(simulation, index).netCashFlow;
      expect(at(simulation, index).cash).toBeCloseTo(cumulative, 4);
    }
  });

  it('derives MRR from customers and ARPU in every month', () => {
    const simulation = run();
    for (const point of simulation.points) {
      expect(point.mrr).toBeCloseTo(point.customers * point.arpu, 4);
    }
  });

  it('builds a break-even MRR that really produces break-even cash flow', () => {
    const base = analyze();
    const breakEvenMrr = base.derived.health.breakEvenMrr.value;
    const breakEvenCustomers = base.derived.health.breakEvenCustomers.value;
    expect(breakEvenMrr).not.toBeNull();
    expect(breakEvenCustomers).not.toBeNull();

    // Break-even is a steady-state figure: acquisition at exactly replacement
    // rate, no expansion and CAC held at its current value. Feeding those
    // conditions back in must net to zero.
    const steady = analyze({
      startingCustomers: breakEvenCustomers as number,
      monthlyExpansionPct: 0,
      acquisitionMode: 'direct',
      cacMode: 'direct',
      cac: base.derived.unit.cac.value as number,
      monthlyNewCustomers: (breakEvenCustomers as number) * (DEFAULT_MODEL.monthlyChurnPct / 100),
    });
    const next = at(steady.simulation, 1);
    expect(Math.abs(next.netCashFlow)).toBeLessThan(next.revenue * 0.01);
  });

  it('states the break-even figure as a steady-state target', () => {
    const { derived } = analyze();
    expect(derived.health.breakEvenMrr.value).toBeGreaterThan(derived.today.mrr);
  });
});

describe('interconnection', () => {
  it('flows a churn change through customers, MRR, LTV and runway', () => {
    const base = analyze();
    const higher = analyze({ monthlyChurnPct: 5 });

    expect(higher.derived.next.customers).toBeLessThan(base.derived.next.customers);
    expect(higher.derived.next.mrr).toBeLessThan(base.derived.next.mrr);
    expect(higher.derived.unit.ltv.value).toBeLessThan(base.derived.unit.ltv.value as number);
    expect(higher.derived.unit.ltvToCac.value).toBeLessThan(base.derived.unit.ltvToCac.value as number);
    expect(higher.derived.health.runwayMonths.value).toBeLessThan(
      base.derived.health.runwayMonths.value as number,
    );
    // CAC payback is a function of margin and CAC, so churn must not move it
    expect(higher.derived.unit.paybackMonths.value).toBeCloseTo(
      base.derived.unit.paybackMonths.value as number,
      6,
    );
  });

  it('scales revenue with pricing', () => {
    const base = at(run(), 0);
    const raised = at(run({ arpu: DEFAULT_MODEL.arpu * 1.2 }), 0);
    expect(raised.mrr).toBeCloseTo(base.mrr * 1.2, 4);
    expect(raised.arr).toBeCloseTo(base.arr * 1.2, 4);
  });

  it('hits the target growth rate exactly in growth mode', () => {
    const simulation = run({ acquisitionMode: 'growth', monthlyGrowthPct: 8 });
    for (let index = 1; index <= 12; index += 1) {
      expect(at(simulation, index).mrrGrowth).toBeCloseTo(0.08, 6);
    }
  });

  it('ignores the funnel when customers are entered directly', () => {
    const simulation = run({ acquisitionMode: 'direct', monthlyNewCustomers: 25, monthlyVisitors: 9_999_999 });
    expect(at(simulation, 1).newCustomers).toBe(25);
    expect(baselineNewCustomers(model({ acquisitionMode: 'direct', monthlyNewCustomers: 25 }))).toBe(25);
  });

  it('treats a growth target below the churn floor as zero acquisition', () => {
    const simulation = run({ acquisitionMode: 'growth', monthlyGrowthPct: -10, monthlyChurnPct: 10 });
    expect(at(simulation, 1).newCustomers).toBe(0);
    expect(at(simulation, 1).mrr).toBeLessThan(at(simulation, 0).mrr);
    expect(simulation.advisories.map((advisory) => advisory.id)).toContain('no-acquisition');
  });
});

describe('edge cases', () => {
  it('handles zero customers and zero revenue without producing NaN or Infinity', () => {
    const { derived, simulation: zeroed } = analyze({
      startingCustomers: 0,
      arpu: 0,
      monthlyVisitors: 0,
      startingCash: 0,
      monthlyOpex: 0,
      monthlySmSpend: 0,
    });
    for (const point of zeroed.points) {
      for (const value of everyNumber(point)) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(point.mrr).toBe(0);
      expect(point.customers).toBe(0);
    }

    expect(derived.unit.ltv.value).toBeNull();
    expect(derived.unit.ltv.reason).toBeTruthy();
    expect(derived.unit.ltvToCac.value).toBeNull();
    expect(derived.health.breakEvenMrr.value).toBeNull();
    expect(derived.health.runwayMonths.value).toBe(0);
  });

  it('handles a single customer', () => {
    const { derived } = analyze({ startingCustomers: 1 });
    expect(derived.today.mrr).toBe(DEFAULT_MODEL.arpu);
    expect(Number.isFinite(derived.next.mrr)).toBe(true);
  });

  it('reports LTV as not applicable at zero churn instead of Infinity', () => {
    const { derived } = analyze({ monthlyChurnPct: 0 });
    expect(derived.unit.ltv.value).toBeNull();
    expect(derived.unit.ltv.reason).toMatch(/zero churn/i);
    expect(derived.unit.ltvToCac.value).toBeNull();
    expect(derived.netRetention).toBeCloseTo(1.012, 6);
  });

  it('survives 100% churn', () => {
    const simulation = run({ monthlyChurnPct: 100 });
    const month1 = at(simulation, 1);
    const month2 = at(simulation, 2);
    expect(month1.customers).toBeCloseTo(42, 6);
    expect(month2.customers).toBeCloseTo(42, 6);
    for (const point of simulation.points) {
      for (const value of everyNumber(point)) expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('handles zero CAC by refusing to report a ratio', () => {
    const { derived } = analyze({ cacMode: 'direct', cac: 0 });
    expect(derived.unit.cac.value).toBe(0);
    expect(derived.unit.ltvToCac.value).toBeNull();
    expect(derived.unit.ltvToCac.reason).toMatch(/free/i);
    expect(derived.unit.paybackMonths.value).toBe(0);
  });

  it('cannot derive CAC from spend when there are no new customers', () => {
    const { model: noAcquisition, simulation, derived } = analyze({ monthlyVisitors: 0 });
    expect(simulation.effectiveCac.value).toBeNull();
    expect(simulation.effectiveCac.reason).toBeTruthy();
    // spend is held flat rather than silently inventing a CAC
    expect(at(simulation, 1).smSpend).toBe(noAcquisition.monthlySmSpend);
    expect(derived.health.breakEvenMrr.value).toBeNull();
    expect(derived.health.breakEvenMrr.reason).toMatch(/CAC/i);
    expect(derived.health.breakEvenCustomers.value).toBeNull();
    expect(derived.unit.paybackMonths.value).toBeNull();
  });

  it('handles 0% and 100% gross margin', () => {
    const none = analyze({ grossMarginPct: 0 }).derived;
    expect(none.next.grossProfit).toBe(0);
    expect(none.next.cogs).toBeCloseTo(none.next.revenue, 6);
    expect(none.unit.ltv.value).toBeNull();

    const all = analyze({ grossMarginPct: 100 }).derived;
    expect(all.next.grossProfit).toBeCloseTo(all.next.revenue, 6);
    expect(all.unit.grossProfitPerCustomer.value).toBeCloseTo(DEFAULT_MODEL.arpu, 6);
  });

  it('handles zero operating expenses', () => {
    const month1 = at(run({ monthlyOpex: 0 }), 1);
    expect(month1.opex).toBe(0);
    expect(month1.netCashFlow).toBeCloseTo(month1.grossProfit - month1.smSpend, 6);
  });

  it('handles a profitable business: no runway, break-even already passed', () => {
    const { derived } = analyze({ monthlyOpex: 0, grossMarginPct: 100, arpu: 500, monthlyChurnPct: 0.5 });
    expect(derived.health.profitableNow).toBe(true);
    expect(derived.health.netBurn).toBe(0);
    expect(derived.health.runwayMonths.value).toBeNull();
    expect(derived.health.runwayMonths.reason).toMatch(/positive/i);
    expect(derived.health.monthsToBreakEven.reason).toMatch(/already/i);
  });

  it('explains unreachable break-even instead of dividing by a negative contribution', () => {
    const { derived } = analyze({ monthlyChurnPct: 20, grossMarginPct: 20, cac: 4000, cacMode: 'direct' });
    expect(derived.health.breakEvenMrr.value).toBeNull();
    expect(derived.health.breakEvenMrr.reason).toMatch(/not reachable/i);
    expect(derived.health.breakEvenCustomers.value).toBeNull();
    expect(derived.health.breakEvenCustomers.reason).toMatch(/not reachable/i);
  });

  it('stays finite with extreme inputs', () => {
    const extremes: Partial<Model>[] = [
      { monthlyVisitors: 5_000_000, visitorToSignupPct: 100, signupToPaidPct: 100, arpu: 1_000_000 },
      { monthlyGrowthPct: 100, acquisitionMode: 'growth' },
      { monthlyNewCustomers: 100_000, acquisitionMode: 'direct', monthlyChurnPct: 0 },
      { startingCustomers: 10_000_000, startingCash: 1_000_000_000, monthlyOpex: 10_000_000 },
      { arpu: 0, grossMarginPct: 0, monthlyOpex: 0 },
    ];

    for (const overrides of extremes) {
      const { simulation, derived } = analyze(overrides);
      expect(simulation.points.length).toBe(MAX_MONTHS + 1);
      for (const point of simulation.points) {
        for (const value of everyNumber(point)) {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
      const metrics = [
        derived.unit.ltv,
        derived.unit.cac,
        derived.unit.ltvToCac,
        derived.unit.paybackMonths,
        derived.health.runwayMonths,
        derived.health.breakEvenMrr,
        derived.health.breakEvenCustomers,
        derived.health.monthsToBreakEven,
      ];
      for (const value of metrics) {
        if (value.value !== null) expect(Number.isFinite(value.value)).toBe(true);
      }
    }
  });

  it('parses messy numbers from a shared link or pasted input', () => {
    expect(parseNumericInput('1,234.5')).toBe(1234.5);
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('-')).toBeNull();
    expect(parseNumericInput('abc')).toBeNull();
    expect(normalizeModel({ arpu: Number.NaN, monthlyChurnPct: 'nonsense' }).arpu).toBe(DEFAULT_MODEL.arpu);
    expect(normalizeModel({ monthlyChurnPct: 900 }).monthlyChurnPct).toBe(100);
    expect(normalizeModel({ currency: 'XYZ' }).currency).toBe('USD');
    expect(normalizeModel({ acquisitionMode: 'wat' }).acquisitionMode).toBe('funnel');
  });
});

describe('scenarios', () => {
  it('moves retention and acquisition in opposite directions', () => {
    const base = model();
    const conservative = applyPreset(base, 'conservative');
    const aggressive = applyPreset(base, 'aggressive');

    expect(conservative.monthlyChurnPct).toBeGreaterThan(base.monthlyChurnPct);
    expect(aggressive.monthlyChurnPct).toBeLessThan(base.monthlyChurnPct);
    expect(conservative.monthlyVisitors).toBeLessThan(base.monthlyVisitors);
    expect(aggressive.monthlyVisitors).toBeGreaterThan(base.monthlyVisitors);
    expect(conservative.monthlySmSpend).toBeGreaterThan(base.monthlySmSpend);
  });

  it('applies the CAC multiplier to the input that actually drives CAC', () => {
    const bySpend = applyPreset(model({ cacMode: 'spend' }), 'aggressive');
    expect(bySpend.monthlySmSpend).toBeCloseTo(DEFAULT_MODEL.monthlySmSpend * 0.85, 6);

    const byDirect = applyPreset(model({ cacMode: 'direct', cac: 400 }), 'aggressive');
    expect(byDirect.cac).toBeCloseTo(340, 6);
  });

  it('applies the acquisition multiplier to the active driver', () => {
    expect(applyPreset(model({ acquisitionMode: 'direct' }), 'conservative').monthlyNewCustomers).toBeCloseTo(
      DEFAULT_MODEL.monthlyNewCustomers * 0.75,
      6,
    );
    expect(applyPreset(model({ acquisitionMode: 'growth' }), 'aggressive').monthlyGrowthPct).toBeCloseTo(10.8, 6);
  });

  it('describes exactly what changed', () => {
    const base = model();
    const changes = describeChanges(base, applyPreset(base, 'conservative'));
    const fields = changes.map((change) => change.field);
    expect(fields).toContain('monthlyChurnPct');
    expect(fields).toContain('monthlyVisitors');
    expect(fields).not.toContain('arpu');
    const churn = changes.find((change) => change.field === 'monthlyChurnPct');
    expect(churn?.display).toBe('+1.2pp');
  });

  it('never lets a preset push the model out of its bounds', () => {
    const extreme = model({ monthlyChurnPct: 99.5, monthlyExpansionPct: 99, grossMarginPct: 99 });
    const conservative = applyPreset(extreme, 'conservative');
    const aggressive = applyPreset(extreme, 'aggressive');
    for (const spec of FIELD_SPECS) {
      expect(conservative[spec.key]).toBeLessThanOrEqual(spec.max);
      expect(conservative[spec.key]).toBeGreaterThanOrEqual(spec.min);
      expect(aggressive[spec.key]).toBeLessThanOrEqual(spec.max);
      expect(aggressive[spec.key]).toBeGreaterThanOrEqual(spec.min);
    }
  });
});

describe('what-if levers', () => {
  it('is neutral until a lever is moved', () => {
    const base = model();
    expect(applyLevers(base, EMPTY_LEVERS)).toEqual(base);
  });

  it('applies absolute and multiplicative levers', () => {
    const base = analyze();
    const values: LeverValues = { churn: 5, pricing: 1.2 };
    const next = applyLevers(base.model, values);

    expect(next.monthlyChurnPct).toBe(5);
    expect(next.arpu).toBeCloseTo(base.model.arpu * 1.2, 6);
    // downstream effects come from the same engine, so they are guaranteed to agree
    const nextAnalysis = analyzeModel(next);
    expect(nextAnalysis.derived.unit.ltv.value).toBeLessThan(base.derived.unit.ltv.value as number);
  });

  it('rounds share links through a decode without losing the model', () => {
    const base = model({ currency: 'INR', acquisitionMode: 'growth', monthlyGrowthPct: 7.25 });
    const decoded = decodeModel(encodeModel(base));
    expect(decoded).toEqual(base);
  });

  it('rejects malformed share payloads', () => {
    expect(decodeModel('')).toBeNull();
    expect(decodeModel('2|USD|funnel|spend|1')).toBeNull();
    expect(decodeModel('1|USD|funnel')).toBeNull();
  });
});

describe('export', () => {
  it('writes one CSV row per month plus a header', () => {
    const csv = projectionCsv(run({}, 12).points);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(14);
    expect(lines[0]).toContain('MRR');
    expect(lines[1]?.split(',')).toHaveLength(21);
  });
});

describe('formatting', () => {
  it('never renders NaN or Infinity', () => {
    const formatters = createFormatters('USD');
    expect(formatters.money(Number.NaN)).toBe('\u2014');
    expect(formatters.money(Number.POSITIVE_INFINITY)).toBe('\u2014');
    expect(formatters.percent(Number.NaN)).toBe('\u2014');
    expect(formatters.multiplier(Number.NaN)).toBe('\u2014');
  });

  it('formats currency per locale instead of hardcoding dollars', () => {
    expect(createFormatters('USD').money(24_780)).toBe('$24,780');
    expect(createFormatters('GBP').money(24_780)).toContain('£');
    expect(createFormatters('EUR').money(24_780)).toContain('€');
    expect(createFormatters('INR').money(24_780)).toContain('₹');
    expect(createFormatters('INR').moneyCompact(12_000_000)).toContain('Cr');
  });

  it('formats compact money usefully for axes', () => {
    const usd = createFormatters('USD');
    expect(usd.moneyCompact(24_780)).toBe('$24.8K');
    expect(usd.moneyCompact(1_200_000)).toBe('$1.2M');
    expect(usd.moneyCompact(500)).toBe('$500');
  });
});
