import { FIELD_SPECS } from './constants';
import { round } from './math';
import { normalizeModel } from './validate';
import type { Model } from './types';

/**
 * Shareable models live in the URL hash, so a link is enough — no backend.
 *
 * Wire format: `#m=<version>|<currency>|<acquisitionMode>|<cacMode>|<numbers…>`
 * Numbers follow the FIELD_SPECS order. Append new fields to the end and bump
 * the version; older links keep working because parsing is positional + padded.
 */
const VERSION = '1';
const NUMERIC_KEYS = FIELD_SPECS.map((spec) => spec.key);

export function encodeModel(model: Model): string {
  const parts = [VERSION, model.currency, model.acquisitionMode, model.cacMode];
  for (const key of NUMERIC_KEYS) {
    parts.push(String(round(model[key], 4)));
  }
  return parts.join('|');
}

export function decodeModel(payload: string): Model | null {
  const parts = payload.split('|');
  if (parts.length < 4 || parts[0] !== VERSION) return null;

  const [, currency, acquisitionMode, cacMode] = parts;
  const raw: Record<string, unknown> = { currency, acquisitionMode, cacMode };

  NUMERIC_KEYS.forEach((key, index) => {
    const token = parts[index + 4];
    if (token === undefined || token === '') return;
    const value = Number(token);
    if (Number.isFinite(value)) raw[key] = value;
  });

  return normalizeModel(raw);
}

export function buildShareUrl(model: Model): string {
  const base =
    typeof window === 'undefined' ? 'https://example.com/' : `${window.location.origin}${window.location.pathname}`;
  return `${base}#m=${encodeURIComponent(encodeModel(model))}`;
}

/** Reads a shared model out of a URL hash, if there is a valid one. */
export function readModelFromHash(hash: string): Model | null {
  const match = /[#&]m=([^&]+)/.exec(hash);
  if (!match?.[1]) return null;
  try {
    return decodeModel(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
