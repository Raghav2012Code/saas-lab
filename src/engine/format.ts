import { currencyConfig, type CurrencyConfig } from './currency';
import { finite } from './math';
import type { CurrencyCode, Metric } from './types';

/** Shown wherever a metric genuinely cannot be computed. */
export const EMPTY = '\u2014';

export interface Formatters {
  currency: CurrencyConfig;
  symbol: string;
  /** $24,780 */
  money(value: number, decimals?: number): string;
  /** $24.8K — for axes and tiles */
  moneyCompact(value: number, decimals?: number): string;
  /** 1,312 */
  number(value: number, decimals?: number): string;
  /** 1.2M — compact counts for axes */
  numberCompact(value: number): string;
  /** takes a 0–100 value: 12.4% */
  percent(value: number, decimals?: number): string;
  /** takes a fraction: 0.124 → 12.4% */
  rate(value: number, decimals?: number): string;
  /** 4.2x */
  multiplier(value: number): string;
  /** 5.1 mo */
  months(value: number): string;
  /** forces a leading + on positive numbers */
  signed(text: string, value: number): string;
  /** renders a Metric, falling back to an em dash */
  metric(metric: Metric, render: (value: number) => string): string;
}

const cache = new Map<CurrencyCode, Formatters>();

function decimalsForMagnitude(value: number, small = 2, medium = 1): number {
  const magnitude = Math.abs(finite(value));
  if (magnitude >= 100) return 0;
  if (magnitude >= 10) return medium;
  return small;
}

export function createFormatters(code: CurrencyCode): Formatters {
  const cached = cache.get(code);
  if (cached) return cached;

  const currency = currencyConfig(code);

  const moneyFormat = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  });

  const moneyFormatPrecise = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const numberFormat = new Intl.NumberFormat(currency.locale, { maximumFractionDigits: 0 });
  const numberCompactFormat = new Intl.NumberFormat(currency.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  // Cache Intl.NumberFormat instances with options as key to prevent repeated
  // initialization overhead during table/chart rendering (which formats 500+ numbers per view).
  const intlFormatCache = new Map<string, Intl.NumberFormat>();
  function getNumberFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = JSON.stringify(options);
    let formatter = intlFormatCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(currency.locale, options);
      intlFormatCache.set(key, formatter);
    }
    return formatter;
  }

  const formatters: Formatters = {
    currency,
    symbol: currency.symbol,

    money(value, decimals) {
      if (!Number.isFinite(value)) return EMPTY;
      if (decimals === undefined) {
        return Math.abs(value) < 1000 && !Number.isInteger(value)
          ? moneyFormatPrecise.format(value)
          : moneyFormat.format(value);
      }
      return getNumberFormatter({
        style: 'currency',
        currency: currency.code,
        currencyDisplay: 'symbol',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },

    moneyCompact(value, decimals = 1) {
      if (!Number.isFinite(value)) return EMPTY;
      if (Math.abs(value) < 1000) return formatters.money(value);
      const magnitude = Math.abs(value);
      const digits = magnitude >= 10_000_000 ? 0 : decimals;
      return getNumberFormatter({
        style: 'currency',
        currency: currency.code,
        currencyDisplay: 'narrowSymbol',
        notation: 'compact',
        maximumFractionDigits: digits,
      }).format(value);
    },

    number(value, decimals = 0) {
      if (!Number.isFinite(value)) return EMPTY;
      if (decimals === 0) return numberFormat.format(value);
      return getNumberFormatter({
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },

    numberCompact(value) {
      if (!Number.isFinite(value)) return EMPTY;
      if (Math.abs(value) < 10_000) return numberFormat.format(value);
      return numberCompactFormat.format(value);
    },

    percent(value, decimals) {
      if (!Number.isFinite(value)) return EMPTY;
      const digits = decimals ?? decimalsForMagnitude(value);
      return `${getNumberFormatter({
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)}%`;
    },

    rate(value, decimals) {
      return formatters.percent(value * 100, decimals);
    },

    multiplier(value) {
      if (!Number.isFinite(value)) return EMPTY;
      if (value > 100) return '100x+';
      const digits = Math.abs(value) >= 10 ? 1 : 1;
      return `${getNumberFormatter({
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)}x`;
    },

    months(value) {
      if (!Number.isFinite(value)) return EMPTY;
      const digits = value >= 100 ? 0 : 1;
      return `${getNumberFormatter({
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)} mo`;
    },

    signed(text, value) {
      if (!Number.isFinite(value)) return text;
      return value > 0 ? `+${text}` : text;
    },

    metric(metric, render) {
      return metric.value === null ? EMPTY : render(metric.value);
    },
  };

  cache.set(code, formatters);
  return formatters;
}
