import { FIELD_SPECS_BY_KEY } from './constants';
import { acquisitionDriverField, cacDriverField } from './model';
import { clampField } from './validate';
import type { Model, NumericField } from './types';

export type LeverUnit = 'percent' | 'currency' | 'multiplier';

export interface WhatIfLever {
  id: string;
  label: string;
  /** the question this lever answers, shown as the slider's caption */
  question: string;
  kind: 'scale' | 'absolute';
  field: (model: Model) => NumericField;
  min: number;
  max: number;
  step: number;
  unit: LeverUnit;
  /** hidden when it does not apply to the current model */
  visible?: (model: Model) => boolean;
}

/**
 * The what-if levers. Scale levers multiply the input they control (pricing ×1.2),
 * absolute levers set a rate outright (churn 5%). Both are neutral by default.
 */
export const WHAT_IF_LEVERS: WhatIfLever[] = [
  {
    id: 'churn',
    label: 'Monthly churn',
    question: 'What if churn were different?',
    kind: 'absolute',
    field: () => 'monthlyChurnPct',
    min: 0,
    max: 15,
    step: 0.1,
    unit: 'percent',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    question: 'What if I charged more or less?',
    kind: 'scale',
    field: () => 'arpu',
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: 'multiplier',
  },
  {
    id: 'cac',
    label: 'Acquisition cost',
    question: 'What if CAC moved?',
    kind: 'scale',
    field: cacDriverField,
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: 'multiplier',
  },
  {
    id: 'acquisition',
    label: 'Acquisition volume',
    question: 'What if I acquired more or fewer customers?',
    kind: 'scale',
    field: acquisitionDriverField,
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: 'multiplier',
  },
  {
    id: 'conversion',
    label: 'Signup conversion',
    question: 'What if signups converted twice as well?',
    kind: 'scale',
    field: () => 'signupToPaidPct',
    min: 0.5,
    max: 3,
    step: 0.05,
    unit: 'multiplier',
    visible: (model) => model.acquisitionMode === 'funnel',
  },
  {
    id: 'expansion',
    label: 'Expansion',
    question: 'What if existing customers expanded more?',
    kind: 'absolute',
    field: () => 'monthlyExpansionPct',
    min: 0,
    max: 6,
    step: 0.1,
    unit: 'percent',
  },
  {
    id: 'margin',
    label: 'Gross margin',
    question: 'What if gross margin changed?',
    kind: 'absolute',
    field: () => 'grossMarginPct',
    min: 0,
    max: 100,
    step: 1,
    unit: 'percent',
  },
  {
    id: 'expenses',
    label: 'Operating expenses',
    question: 'What if expenses were higher or lower?',
    kind: 'scale',
    field: () => 'monthlyOpex',
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: 'multiplier',
  },
];

/** Lever overrides. `null` means "follow the model"; a number applies the lever. */
export type LeverValues = Record<string, number | null>;

export const EMPTY_LEVERS: LeverValues = Object.fromEntries(WHAT_IF_LEVERS.map((l) => [l.id, null]));

/** The width the slider should show, following the model when not overridden. */
export function leverValue(lever: WhatIfLever, model: Model, values: LeverValues): number {
  const override = values[lever.id];
  if (override !== null && override !== undefined) return override;
  if (lever.kind === 'absolute') return model[lever.field(model)];
  return 1;
}

export function visibleLevers(model: Model): WhatIfLever[] {
  return WHAT_IF_LEVERS.filter((lever) => !lever.visible || lever.visible(model));
}

export function activeLevers(model: Model, values: LeverValues): WhatIfLever[] {
  return visibleLevers(model).filter((lever) => {
    const override = values[lever.id];
    if (override === null || override === undefined) return false;
    return Math.abs(override - (lever.kind === 'absolute' ? model[lever.field(model)] : 1)) > 1e-9;
  });
}

/** The model as the levers describe it — still a plain Model, so everything downstream works. */
export function applyLevers(model: Model, values: LeverValues): Model {
  const next: Model = { ...model };

  for (const lever of visibleLevers(model)) {
    const override = values[lever.id];
    if (override === null || override === undefined || !Number.isFinite(override)) continue;

    const field = lever.field(model);
    const spec = FIELD_SPECS_BY_KEY[field];
    const current = next[field];
    const target = lever.kind === 'absolute' ? override : current * override;
    if (Math.abs(target - current) < 1e-9) continue;
    next[field] = clampField(spec, target);
  }

  return next;
}
