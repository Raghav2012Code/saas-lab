import type { CurrencyCode } from './types';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** locale used for grouping, symbol placement and compact suffixes */
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', label: 'US dollar', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', label: 'Pound sterling', symbol: '£', locale: 'en-GB' },
  INR: { code: 'INR', label: 'Indian rupee', symbol: '₹', locale: 'en-IN' },
};

export const CURRENCY_ORDER: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR'];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in CURRENCIES;
}

export function currencyConfig(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES[code] ?? CURRENCIES.USD;
}
