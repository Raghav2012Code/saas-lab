import { DEFAULT_MODEL } from './constants';
import type { Model } from './types';
import { normalizeModel } from './validate';

export interface Preset {
  id: 'pre-revenue' | 'growing' | 'profitable';
  name: string;
  blurb: string;
  model: Model;
}

function build(overrides: Partial<Model>): Model {
  return normalizeModel({ ...DEFAULT_MODEL, ...overrides });
}

export const PRESETS: Preset[] = [
  {
    id: 'pre-revenue',
    name: 'Pre-revenue',
    blurb: 'Just launched: a handful of early customers and a burn to watch.',
    model: build({
      startingCustomers: 5,
      startingCash: 200_000,
      arpu: 49,
      monthlyVisitors: 4_000,
      monthlyChurnPct: 5,
      monthlyExpansionPct: 0.5,
      monthlyOpex: 25_000,
      monthlySmSpend: 8_000,
    }),
  },
  {
    id: 'growing',
    name: 'Growing',
    blurb: 'Finding fit: steady signups, growing revenue, still burning cash.',
    model: build({}),
  },
  {
    id: 'profitable',
    name: 'Profitable',
    blurb: 'In the black: loyal customers and more cash coming in than going out.',
    model: build({
      startingCustomers: 1_200,
      startingCash: 300_000,
      arpu: 79,
      monthlyVisitors: 15_000,
      monthlyChurnPct: 1.8,
      monthlyExpansionPct: 1.5,
      grossMarginPct: 86,
      monthlyOpex: 40_000,
      monthlySmSpend: 8_000,
    }),
  },
];
