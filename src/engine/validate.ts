import { DEFAULT_MODEL, FIELD_SPECS } from './constants';
import { isCurrencyCode } from './currency';
import { toNumber } from './math';
import type { AcquisitionMode, CacMode, FieldSpec, Model, NumericField } from './types';

const ACQUISITION_MODES: AcquisitionMode[] = ['funnel', 'direct', 'growth'];
const CAC_MODES: CacMode[] = ['spend', 'direct'];

/** Parses user text into a number, or null when it is not yet a number. */
export function parseNumericInput(text: string): number | null {
  const trimmed = text.trim().replace(/,/g, '');
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clamps a raw value into a field's hard bounds. */
export function clampField(spec: FieldSpec, value: number): number {
  return toNumber(value, 0, spec.min, spec.max);
}

/** A soft warning for a value that is legal but unusual. Null when fine. */
export function fieldWarning(spec: FieldSpec, value: number): string | null {
  const { warnings } = spec;
  if (!warnings) return null;
  if (warnings.above && value > warnings.above.value) return warnings.above.message;
  if (warnings.below && value <= warnings.below.value) return warnings.below.message;
  return null;
}

/**
 * Coerces anything (local storage, a shared URL, a hand-edited value) into a
 * valid model. Unknown keys are dropped, missing keys fall back to defaults and
 * every number is clamped into range, so the engine never sees NaN.
 */
export function normalizeModel(raw: unknown): Model {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const currency = isCurrencyCode(source.currency) ? source.currency : DEFAULT_MODEL.currency;
  const acquisitionMode = ACQUISITION_MODES.includes(source.acquisitionMode as AcquisitionMode)
    ? (source.acquisitionMode as AcquisitionMode)
    : DEFAULT_MODEL.acquisitionMode;
  const cacMode = CAC_MODES.includes(source.cacMode as CacMode)
    ? (source.cacMode as CacMode)
    : DEFAULT_MODEL.cacMode;

  const model: Model = { ...DEFAULT_MODEL, currency, acquisitionMode, cacMode };

  for (const spec of FIELD_SPECS) {
    const value = source[spec.key];
    model[spec.key] =
      value === undefined || value === null
        ? DEFAULT_MODEL[spec.key]
        : clampField(spec, toNumber(value, DEFAULT_MODEL[spec.key]));
  }

  return model;
}

/** True when the model only uses its default assumptions. */
export function isDefaultModel(model: Model): boolean {
  return FIELD_SPECS.every((spec) => model[spec.key] === DEFAULT_MODEL[spec.key]);
}

export interface FieldIssue {
  field: NumericField;
  message: string;
}

/** Every soft warning currently triggered by the model. */
export function modelWarnings(model: Model): FieldIssue[] {
  const issues: FieldIssue[] = [];
  for (const spec of FIELD_SPECS) {
    const message = fieldWarning(spec, model[spec.key]);
    if (message) issues.push({ field: spec.key, message });
  }
  return issues;
}

/** Fields that are relevant for the model's current modes, in display order. */
export function visibleFields(model: Model): FieldSpec[] {
  return FIELD_SPECS.filter((spec) => {
    if (spec.acquisitionModes && !spec.acquisitionModes.includes(model.acquisitionMode)) return false;
    if (spec.cacModes && !spec.cacModes.includes(model.cacMode)) return false;
    return true;
  });
}
