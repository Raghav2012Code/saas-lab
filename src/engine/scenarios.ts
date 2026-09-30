import { createFormatters } from './format';
import { acquisitionDriverField, cacDriverField, simulate } from './model';
import { finite } from './math';
import { derive } from './metrics';
import { FIELD_SPECS, SCENARIO_PRESETS, SCENARIO_PRESET_BY_ID } from './constants';
import { clampField } from './validate';
import type { ModelChange, Model, NumericField, ScenarioId, ScenarioResult } from './types';

/**
 * Applies a preset to a copy of the model. Deliberately mechanical: every change
 * is a stated multiplier or additive shift, and the resulting diff is shown to
 * the user so nothing about a scenario is hidden.
 */
export function applyPreset(model: Model, id: Exclude<ScenarioId, 'base'>): Model {
  const preset = SCENARIO_PRESET_BY_ID[id];
  if (!preset) return { ...model };

  const next: Model = { ...model };
  const acquisitionField = acquisitionDriverField(model);
  const cacField = cacDriverField(model);

  const apply = (field: NumericField, op: { op: 'add' | 'multiply'; value: number }) => {
    const spec = FIELD_SPECS.find((item) => item.key === field);
    if (!spec) return;
    const current = finite(next[field]);
    const result = op.op === 'multiply' ? current * op.value : current + op.value;
    next[field] = clampField(spec, result);
  };

  apply(acquisitionField, preset.acquisition);

  for (const [field, op] of Object.entries(preset.fields) as [NumericField, { op: 'add' | 'multiply'; value: number }][]) {
    // The CAC multiplier has to act on whichever input actually drives CAC.
    apply(field === 'cac' ? cacField : field, op);
  }

  // Guard against a preset driving growth negative in growth mode.
  if (next.acquisitionMode === 'growth' && next.monthlyGrowthPct < 0) {
    next.monthlyGrowthPct = 0;
  }

  return next;
}

function formatChangeValue(model: Model, field: NumericField, delta: number): string {
  const spec = FIELD_SPECS.find((item) => item.key === field);
  const formatters = createFormatters(model.currency);
  const sign = delta > 0 ? '+' : '-';
  const magnitude = Math.abs(delta);

  if (!spec) return `${sign}${magnitude}`;

  if (spec.unit === 'percent') {
    // percentage points, which is what a change in a rate means
    return `${sign}${formatters.number(magnitude, magnitude < 10 ? 1 : 0)}pp`;
  }
  if (spec.unit === 'currency') {
    return `${sign}${formatters.money(magnitude, 0)}`;
  }
  return `${sign}${formatters.number(magnitude, magnitude < 10 ? 1 : 0)}`;
}

/** A human-readable diff between two models, for scenario and preview labels. */
export function describeChanges(base: Model, next: Model): ModelChange[] {
  const changes: ModelChange[] = [];

  for (const spec of FIELD_SPECS) {
    const from = finite(base[spec.key]);
    const to = finite(next[spec.key]);
    if (Math.abs(to - from) < 1e-9) continue;

    changes.push({
      field: spec.key,
      label: spec.label,
      from,
      to,
      display: formatChangeValue(base, spec.key, to - from),
      direction: to > from ? 'up' : 'down',
    });
  }

  return changes;
}

/** Base plus both presets, each simulated and derived. */
export function buildScenarios(model: Model): ScenarioResult[] {
  return [
    {
      id: 'conservative' as const,
      label: 'Conservative',
      description: SCENARIO_PRESET_BY_ID.conservative.description,
      model: applyPreset(model, 'conservative'),
    },
    {
      id: 'base' as const,
      label: 'Base',
      description: 'Your assumptions exactly as entered.',
      model: { ...model },
    },
    {
      id: 'aggressive' as const,
      label: 'Aggressive',
      description: SCENARIO_PRESET_BY_ID.aggressive.description,
      model: applyPreset(model, 'aggressive'),
    },
  ].map((entry) => {
    const simulation = simulate(entry.model);
    return {
      ...entry,
      simulation,
      derived: derive(entry.model, simulation),
      changes: describeChanges(model, entry.model),
    };
  });
}

export const SCENARIO_ORDER: ScenarioId[] = ['conservative', 'base', 'aggressive'];

export function scenarioPresetSummary(id: Exclude<ScenarioId, 'base'>): string {
  return SCENARIO_PRESETS.find((preset) => preset.id === id)?.description ?? '';
}
