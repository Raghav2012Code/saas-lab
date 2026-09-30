import type { FieldSpec, HorizonMonths, Model, NumericField, ScenarioId } from './types';

export const MODEL_VERSION = 1;
export const STORAGE_KEY = 'saaslab.model.v1';
export const THEME_KEY = 'saaslab.theme';

/** The simulation always runs this far; horizons slice into it. */
export const MAX_MONTHS = 36;

export const HORIZONS: { months: HorizonMonths; label: string }[] = [
  { months: 12, label: '12 mo' },
  { months: 24, label: '24 mo' },
  { months: 36, label: '36 mo' },
];

export const DEFAULT_HORIZON: HorizonMonths = 24;

/**
 * Defaults describe a small, believable business: ~$25k MRR, growing ~8% a
 * month, burning cash, break-even in year two and roughly a year of runway.
 */
export const DEFAULT_MODEL: Model = {
  currency: 'USD',
  acquisitionMode: 'funnel',
  cacMode: 'spend',

  monthlyVisitors: 12_000,
  visitorToSignupPct: 3.5,
  signupToPaidPct: 10,
  monthlyNewCustomers: 40,
  monthlyGrowthPct: 8,

  monthlyChurnPct: 3.2,
  monthlyExpansionPct: 1.2,

  arpu: 59,

  grossMarginPct: 84,
  monthlyOpex: 34_000,
  opexGrowthPct: 0,
  monthlySmSpend: 12_000,
  cac: 300,
  startingCash: 150_000,
  startingCustomers: 420,
};

/**
 * Every numeric assumption, with its bounds, scrub increment and the wording
 * used for hints, tooltips and validation. The assumptions rail, the what-if
 * levers and the methodology table are all generated from this list — there is
 * one definition of what each input means.
 */
export const FIELD_SPECS: FieldSpec[] = [
  {
    key: 'monthlyVisitors',
    label: 'Monthly visitors',
    suffix: '/mo',
    unit: 'count',
    group: 'Acquisition',
    min: 0,
    max: 5_000_000,
    scrub: 100,
    hint: 'Unique visitors to your site or landing page each month',
    detail:
      'Top of the funnel. Used to derive monthly signups, which then drive new customers. Held constant across the projection, so growth flattens once churn equals acquisition.',
    acquisitionModes: ['funnel'],
  },
  {
    key: 'visitorToSignupPct',
    label: 'Visitor to signup',
    suffix: '%',
    unit: 'percent',
    group: 'Acquisition',
    min: 0,
    max: 100,
    scrub: 0.1,
    hint: 'Share of visitors who start a free account or trial',
    detail:
      'Visitors × this rate gives monthly signups. Typical self-serve SaaS lands between 1% and 5%.',
    warnings: {
      above: { value: 25, message: 'Above 25% is rare — check whether these are qualified signups.' },
    },
    acquisitionModes: ['funnel'],
  },
  {
    key: 'signupToPaidPct',
    label: 'Signup to paid',
    suffix: '%',
    unit: 'percent',
    group: 'Acquisition',
    min: 0,
    max: 100,
    scrub: 0.5,
    hint: 'Share of signups that become paying customers',
    detail:
      'Signups × this rate gives monthly new customers. Self-serve products typically convert 2%–15% without a sales team.',
    warnings: {
      above: { value: 60, message: 'Above 60% suggests these signups are already qualified trials.' },
    },
    acquisitionModes: ['funnel'],
  },
  {
    key: 'monthlyNewCustomers',
    label: 'New customers',
    suffix: '/mo',
    unit: 'count',
    group: 'Acquisition',
    min: 0,
    max: 100_000,
    scrub: 1,
    hint: 'New paying customers added per month',
    detail:
      'Used directly instead of the funnel. Held constant across the projection, so growth flattens once churn equals acquisition.',
    acquisitionModes: ['direct'],
  },
  {
    key: 'monthlyGrowthPct',
    label: 'MRR growth',
    suffix: '%/mo',
    unit: 'percent',
    group: 'Acquisition',
    min: -50,
    max: 100,
    scrub: 0.25,
    hint: 'Target month-over-month MRR growth',
    detail:
      'Working backwards from a growth target. New customers are whatever is needed to hit this after churn; if the target sits below churn, acquisition clamps to zero and MRR falls.',
    acquisitionModes: ['growth'],
  },
  {
    key: 'monthlyChurnPct',
    label: 'Customer churn',
    suffix: '%/mo',
    unit: 'percent',
    group: 'Retention',
    min: 0,
    max: 100,
    scrub: 0.1,
    hint: 'Share of customers who cancel each month',
    detail:
      'Logo churn, applied to last month\u2019s customer count. Drives churned customers, churned MRR, LTV and how long acquisition takes to compound. Best-practice SaaS sits under 2%.',
    warnings: {
      above: { value: 15, message: 'Above 15%/month is extreme — most SaaS sits under 5%.' },
    },
  },
  {
    key: 'monthlyExpansionPct',
    label: 'Expansion',
    suffix: '%/mo',
    unit: 'percent',
    group: 'Retention',
    min: 0,
    max: 100,
    scrub: 0.1,
    hint: 'Extra revenue from existing customers, as a share of MRR',
    detail:
      'Seat growth, upgrades and add-ons. Raises ARPU over time, so it lifts MRR growth and net revenue retention without adding customers.',
    warnings: { above: { value: 15, message: 'Above 15%/month is unusually high expansion.' } },
  },
  {
    key: 'arpu',
    label: 'Revenue per customer',
    suffix: '/mo',
    unit: 'currency',
    group: 'Pricing',
    min: 0,
    max: 1_000_000,
    scrub: 1,
    hint: 'Blended monthly revenue per paying customer',
    detail:
      'Your effective price: total MRR divided by customers, so it already blends every plan. Today\u2019s MRR is customers × this value; it then grows monthly at the expansion rate.',
    warnings: {
      below: { value: 0, message: 'At zero revenue per customer, MRR stays at zero however many customers you add.' },
    },
  },
  {
    key: 'grossMarginPct',
    label: 'Gross margin',
    suffix: '%',
    unit: 'percent',
    group: 'Costs',
    min: 0,
    max: 100,
    scrub: 1,
    hint: 'Revenue left after cost of revenue (hosting, support, payments)',
    detail:
      'Gross profit = revenue × gross margin. Gross profit is what funds acquisition and operations, and it is the margin used in LTV and CAC payback.',
    warnings: {
      below: {
        value: 40,
        message: 'Below 40% is unusual for software — hosting, support or payment costs may be understated.',
      },
    },
  },
  {
    key: 'monthlySmSpend',
    label: 'Sales & marketing',
    suffix: '/mo',
    unit: 'currency',
    group: 'Costs',
    min: 0,
    max: 10_000_000,
    scrub: 100,
    hint: 'Monthly spend on acquiring customers',
    detail:
      'Divided by month-1 new customers to give CAC, which is then held constant: in the projection, spend follows acquisition volume rather than staying flat.',
    cacModes: ['spend'],
  },
  {
    key: 'cac',
    label: 'CAC',
    unit: 'currency',
    group: 'Costs',
    min: 0,
    max: 1_000_000,
    scrub: 5,
    hint: 'Blended cost to acquire one customer',
    detail:
      'Entered directly. Sales & marketing spend in the projection is CAC × new customers, so acquiring faster costs more cash.',
    cacModes: ['direct'],
  },
  {
    key: 'monthlyOpex',
    label: 'Operating expenses',
    suffix: '/mo',
    unit: 'currency',
    group: 'Costs',
    min: 0,
    max: 10_000_000,
    scrub: 500,
    hint: 'R&D and G&A each month',
    detail:
      'Deliberately excludes cost of revenue and sales & marketing so nothing is double counted. Revenue − cost of revenue − S&M − this figure gives net cash flow.',
    warnings: {
      below: { value: 0, message: 'With no operating expenses, net cash flow will look better than reality.' },
    },
  },
  {
    key: 'opexGrowthPct',
    label: 'Expense growth',
    suffix: '%/mo',
    unit: 'percent',
    group: 'Costs',
    min: -20,
    max: 20,
    scrub: 0.1,
    hint: 'Monthly growth in operating expenses',
    detail:
      'Set above zero if you plan to hire into the projection. Left at 0, expenses stay flat, which keeps the model a pure test of revenue growth.',
  },
  {
    key: 'startingCustomers',
    label: 'Starting customers',
    unit: 'count',
    group: 'Starting point',
    min: 0,
    max: 10_000_000,
    scrub: 5,
    hint: 'Paying customers you have today',
    detail:
      'Point A of the model. Today\u2019s MRR is this figure × revenue per customer.',
  },
  {
    key: 'startingCash',
    label: 'Starting cash',
    unit: 'currency',
    group: 'Starting point',
    min: 0,
    max: 1_000_000_000,
    scrub: 5_000,
    hint: 'Cash in the bank today',
    detail:
      'Cash balance today, before any projected cash flow. Runway counts down from here.',
  },
];

export const FIELD_SPECS_BY_KEY: Record<NumericField, FieldSpec> = Object.fromEntries(
  FIELD_SPECS.map((spec) => [spec.key, spec]),
) as Record<NumericField, FieldSpec>;

export const FIELD_GROUPS: FieldSpec['group'][] = [
  'Acquisition',
  'Retention',
  'Pricing',
  'Costs',
  'Starting point',
];

export interface ChangeOp {
  op: 'add' | 'multiply';
  value: number;
}

export interface ScenarioPreset {
  id: Exclude<ScenarioId, 'base'>;
  label: string;
  description: string;
  /** applied to the active acquisition driver (visitors, new customers or growth) */
  acquisition: ChangeOp;
  /** applied to shared assumptions */
  fields: Partial<Record<NumericField, ChangeOp>>;
}

/**
 * Scenarios are deliberately simple, stated multipliers rather than a second
 * engine — every number below is shown in the UI when a scenario is derived.
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: 'Acquisition slows, customers leave sooner, each one costs more.',
    acquisition: { op: 'multiply', value: 0.75 },
    fields: {
      monthlyChurnPct: { op: 'add', value: 1.2 },
      monthlyExpansionPct: { op: 'multiply', value: 0.6 },
      grossMarginPct: { op: 'add', value: -4 },
      cac: { op: 'multiply', value: 1.2 },
      opexGrowthPct: { op: 'add', value: 0.5 },
    },
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'Acquisition compounds, retention improves, each customer costs less.',
    acquisition: { op: 'multiply', value: 1.35 },
    fields: {
      monthlyChurnPct: { op: 'add', value: -1 },
      monthlyExpansionPct: { op: 'multiply', value: 1.6 },
      grossMarginPct: { op: 'add', value: 3 },
      cac: { op: 'multiply', value: 0.85 },
    },
  },
];

export const SCENARIO_PRESET_BY_ID = Object.fromEntries(
  SCENARIO_PRESETS.map((preset) => [preset.id, preset]),
) as Record<ScenarioPreset['id'], ScenarioPreset>;

export interface BenchBand {
  /** at or above this value the metric is strong */
  good: number;
  /** at or above this value the metric is acceptable */
  ok: number;
  /** true when a *lower* number is better */
  lowerIsBetter?: boolean;
  guidance: string;
}

export const BENCH_BANDS: Record<string, BenchBand> = {
  churn: { good: 2, ok: 4.5, lowerIsBetter: true, guidance: 'Under 2%/mo is strong, 2–5% typical, above 5% high' },
  grossMargin: { good: 80, ok: 60, guidance: '80%+ is typical for software' },
  ltvToCac: { good: 3, ok: 1.5, guidance: '3x or better is the usual rule of thumb' },
  payback: { good: 12, ok: 18, lowerIsBetter: true, guidance: 'Under 12 months is healthy' },
  netRetention: { good: 100, ok: 98, guidance: '100%+ means expansion outweighs churn' },
  mrrGrowth: { good: 10, ok: 4, guidance: '10%+/mo compounds to 3x a year; 4–10% is solid' },
  runway: { good: 18, ok: 9, guidance: '18+ months is comfortable, under 9 is tight' },
};
