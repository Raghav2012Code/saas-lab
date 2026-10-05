import { MODEL_VERSION } from '../engine/constants';
import type { Formatters } from '../engine/format';
import type { ModelExport } from '../engine/export';
import { visibleFields } from '../engine/validate';
import type { Derived, Model } from '../engine/types';

/** The assumptions as label/value pairs, for CSV and the methodology table. */
export function assumptionRows(model: Model, fmt: Formatters): { label: string; value: string }[] {
  const rows = visibleFields(model).map((spec) => {
    const value = model[spec.key];
    if (spec.unit === 'currency') return { label: spec.label, value: fmt.money(value) };
    if (spec.unit === 'percent') return { label: spec.label, value: `${value}%` };
    return { label: spec.label, value: fmt.number(value) };
  });

  const modeNames: Record<string, string> = {
    funnel: 'From the funnel',
    direct: 'Entered directly',
    growth: 'From a growth target',
  };

  return [
    { label: 'Currency', value: model.currency },
    { label: 'Volume driven by', value: modeNames[model.acquisitionMode] ?? model.acquisitionMode },
    { label: 'CAC from', value: model.cacMode === 'spend' ? 'Sales & marketing spend' : 'Entered directly' },
    ...rows,
  ];
}

export function buildModelExport(model: Model, derived: Derived, fmt: Formatters): ModelExport {
  return {
    version: MODEL_VERSION,
    exportedAt: new Date().toISOString(),
    currency: model.currency,
    model,
    summary: {
      mrrToday: fmt.money(derived.today.mrr),
      arrToday: fmt.money(derived.today.arr),
      customersToday: derived.today.customers,
      nextMonthMrrGrowth: derived.mrrGrowth === null ? null : fmt.rate(derived.mrrGrowth),
      cac: derived.unit.cac.value === null ? null : fmt.money(derived.unit.cac.value),
      ltv: derived.unit.ltv.value === null ? null : fmt.money(derived.unit.ltv.value),
      ltvToCac: derived.unit.ltvToCac.value === null ? null : fmt.multiplier(derived.unit.ltvToCac.value),
      paybackMonths:
        derived.unit.paybackMonths.value === null ? null : fmt.months(derived.unit.paybackMonths.value),
      runwayMonths:
        derived.health.runwayMonths.value === null ? null : fmt.months(derived.health.runwayMonths.value),
      breakEvenMrr:
        derived.health.breakEvenMrr.value === null ? null : fmt.money(derived.health.breakEvenMrr.value),
    },
  };
}
