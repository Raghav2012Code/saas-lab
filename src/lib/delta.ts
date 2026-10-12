import type { Formatters } from '../engine/format';

export interface DeltaText {
  value: number | null;
  text: string;
  higherIsBetter?: boolean;
}

function deltaBase(
  from: number | null | undefined,
  to: number | null | undefined,
): { change: number; from: number } | { empty: true } | undefined {
  if (from === null || from === undefined || to === null || to === undefined) return undefined;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return undefined;
  const change = to - from;
  if (Math.abs(change) < 1e-9) return { empty: true };
  return { change, from };
}

/** Relative change between two values, for "what if" comparisons. */
export function relativeDelta(
  from: number | null | undefined,
  to: number | null | undefined,
  fmt: Formatters,
  higherIsBetter = true,
): DeltaText | undefined {
  const base = deltaBase(from, to);
  if (!base || 'empty' in base) return base ? { value: 0, text: 'no change', higherIsBetter } : undefined;

  const change = base.change;

  const relative = base.from === 0 ? null : change / Math.abs(base.from);
  if (relative === null) {
    return { value: change, text: `${change > 0 ? '+' : '-'}${fmt.number(Math.abs(change))}`, higherIsBetter };
  }
  return {
    value: change,
    text: `${relative > 0 ? '+' : ''}${fmt.percent(relative * 100, 1)}`,
    higherIsBetter,
  };
}

/** Percentage-point change between two rates (both expressed as 0–100). */
export function pointDelta(
  from: number | null | undefined,
  to: number | null | undefined,
  fmt: Formatters,
  higherIsBetter = true,
): DeltaText | undefined {
  const base = deltaBase(from, to);
  if (!base || 'empty' in base) return base ? { value: 0, text: 'no change', higherIsBetter } : undefined;
  const change = base.change;
  return {
    value: change,
    text: `${change > 0 ? '+' : '-'}${fmt.number(Math.abs(change), 1)}pp`,
    higherIsBetter,
  };
}
