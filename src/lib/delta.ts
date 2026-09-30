import type { Formatters } from '../engine/format';

export interface DeltaText {
  value: number | null;
  text: string;
  higherIsBetter?: boolean;
}

/** Relative change between two values, for "what if" comparisons. */
export function relativeDelta(
  from: number | null | undefined,
  to: number | null | undefined,
  fmt: Formatters,
  higherIsBetter = true,
): DeltaText | undefined {
  if (from === null || from === undefined || to === null || to === undefined) return undefined;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return undefined;

  const change = to - from;
  if (Math.abs(change) < 1e-9) return { value: 0, text: 'no change', higherIsBetter };

  const relative = from === 0 ? null : change / Math.abs(from);
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
  if (from === null || from === undefined || to === null || to === undefined) return undefined;
  const change = to - from;
  if (Math.abs(change) < 1e-9) return { value: 0, text: 'no change', higherIsBetter };
  return {
    value: change,
    text: `${change > 0 ? '+' : '-'}${fmt.number(Math.abs(change), 1)}pp`,
    higherIsBetter,
  };
}
