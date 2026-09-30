/**
 * Numeric guards. Every value that reaches the UI passes through here first so
 * that NaN and Infinity can never be rendered as if they were real numbers.
 */

/** Returns `value` when it is a usable finite number, otherwise `fallback`. */
export function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Coerces arbitrary input (string, null, NaN) into a clamped finite number. */
export function toNumber(raw: unknown, fallback = 0, min = -Infinity, max = Infinity): number {
  let parsed: number;
  if (typeof raw === 'number') {
    parsed = raw;
  } else if (typeof raw === 'string') {
    // Tolerate pasted values like "$1,234.50" or "12,5".
    const cleaned = raw.replace(/[^0-9.eE+-]/g, '');
    parsed = cleaned === '' ? Number.NaN : Number(cleaned);
  } else {
    parsed = Number.NaN;
  }

  if (!Number.isFinite(parsed)) return clamp(finite(fallback), min, max);
  return clamp(parsed, min, max);
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return clamp(min, min, max);
  return Math.min(Math.max(value, min), max);
}

/** Division that returns null instead of Infinity/NaN. */
export function safeDiv(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function isZero(value: number, epsilon = 1e-9): boolean {
  return Math.abs(finite(value)) < epsilon;
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(finite(value) * factor) / factor;
}

/** Growth from `previous` to `current`, as a fraction. Null when undefined. */
export function growthRate(current: number, previous: number): number | null {
  const ratio = safeDiv(current - previous, previous);
  if (ratio === null) return null;
  return Number.isFinite(ratio) ? ratio : null;
}

/** Compounding, with a hard guard against overflow on long horizons. */
export function compound(base: number, rate: number, periods: number): number {
  const value = base * (1 + rate) ** periods;
  if (!Number.isFinite(value)) return base;
  return value;
}
