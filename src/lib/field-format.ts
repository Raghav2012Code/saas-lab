import type { Formatters } from '../engine/format';
import type { FieldSpec } from '../engine/types';

/**
 * One place that turns a raw assumption into the string a human should read,
 * used by the rail's echo and by the what-if levers.
 *
 * Percent fields carry their sign in `suffix` for the input's affix (e.g. "%/mo"),
 * so the leading "%" is stripped here: `fmt.percent` already appends it.
 */
export function formatFieldValue(spec: FieldSpec, value: number, fmt: Formatters): string {
  const suffix = spec.suffix ?? '';
  switch (spec.unit) {
    case 'currency':
      return `${fmt.money(value)}${suffix}`;
    case 'percent':
      return `${fmt.percent(value)}${suffix.startsWith('%') ? suffix.slice(1) : suffix}`;
    default:
      return `${fmt.number(value)}${suffix}`;
  }
}
