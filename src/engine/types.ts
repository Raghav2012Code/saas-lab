/**
 * Types for the SaaS model.
 *
 * The whole app is built on a single `Model` (the user's assumptions) which is
 * fed through one deterministic simulation. Nothing in the UI computes money.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR';

/** How the monthly number of newly acquired customers is determined. */
export type AcquisitionMode =
  /** visitors × visitor→signup × signup→paid */
  | 'funnel'
  /** a fixed number the user types in */
  | 'direct'
  /** derived backwards from a target MRR growth rate */
  | 'growth';

/** How CAC is determined. */
export type CacMode =
  /** monthly sales & marketing spend ÷ new customers */
  | 'spend'
  /** a fixed number the user types in */
  | 'direct';

export type HorizonMonths = 12 | 24 | 36;

export interface Model {
  currency: CurrencyCode;
  acquisitionMode: AcquisitionMode;
  cacMode: CacMode;

  /* Acquisition */
  monthlyVisitors: number;
  visitorToSignupPct: number;
  signupToPaidPct: number;
  /** used when acquisitionMode === 'direct' */
  monthlyNewCustomers: number;
  /** used when acquisitionMode === 'growth', in % per month */
  monthlyGrowthPct: number;

  /* Retention */
  monthlyChurnPct: number;
  /** expansion revenue as % of existing MRR per month */
  monthlyExpansionPct: number;

  /* Pricing */
  /** blended revenue per customer per month */
  arpu: number;

  /* Costs, cash and starting position */
  grossMarginPct: number;
  /** R&D + G&A. Excludes cost of revenue and sales & marketing. */
  monthlyOpex: number;
  opexGrowthPct: number;
  /** used when cacMode === 'spend' */
  monthlySmSpend: number;
  /** used when cacMode === 'direct' */
  cac: number;
  startingCash: number;
  startingCustomers: number;
}

/** Numeric assumptions — everything except the mode/currency switches. */
export type NumericField = Exclude<keyof Model, 'currency' | 'acquisitionMode' | 'cacMode'>;

export type FieldGroup = 'Acquisition' | 'Retention' | 'Pricing' | 'Costs' | 'Starting point';

export type FieldUnit = 'currency' | 'percent' | 'count';

export interface FieldWarning {
  /** trip when the value goes at or above this */
  above?: { value: number; message: string };
  /** trip when the value goes at or below this */
  below?: { value: number; message: string };
}

export interface FieldSpec {
  key: NumericField;
  label: string;
  /** short right-hand unit shown inside the input, e.g. "%", "/mo" */
  suffix?: string;
  unit: FieldUnit;
  group: FieldGroup;
  /** hard bounds — values are clamped to this range */
  min: number;
  max: number;
  /** increment for the drag-scrub handle */
  scrub: number;
  /** one-line clarifying text under the label */
  hint: string;
  /** longer explanation for the info tooltip */
  detail: string;
  warnings?: FieldWarning;
  /** only shown for these acquisition modes */
  acquisitionModes?: AcquisitionMode[];
  /** only shown for these CAC modes */
  cacModes?: CacMode[];
}

/**
 * A derived number that may genuinely be undefined. `reason` explains why in
 * plain language instead of the UI printing Infinity or NaN.
 */
export interface Metric {
  value: number | null;
  reason?: string;
}

export type AdvisorySeverity = 'info' | 'warn' | 'error';

export interface Advisory {
  id: string;
  severity: AdvisorySeverity;
  title: string;
}

/** One month of the simulation. Index 0 is today. */
export interface MonthPoint {
  /** 0 = today, 1 = one month from now */
  month: number;
  /** ISO date of month start, for axis labels */
  date: string;
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
  /** blended revenue per customer this month */
  arpu: number;
  mrr: number;
  arr: number;
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  /** month-over-month MRR growth, as a fraction (0.08 = 8%) */
  mrrGrowth: number | null;
  customerGrowth: number | null;
  revenue: number;
  cogs: number;
  grossProfit: number;
  smSpend: number;
  opex: number;
  netCashFlow: number;
  cash: number;
  /** period net revenue retention as a fraction */
  netRetention: number | null;
}

export interface AcquisitionBreakdown {
  /** visitors that turn into trials/signups in a month */
  signups: number;
  /** trials/signups that become paying customers in a month */
  paid: number;
  /** month-1 revenue attributable to new customers */
  newMrr: number;
}

export interface Simulation {
  /** month 0 (today) through the last projected month */
  points: MonthPoint[];
  /** effective CAC used throughout the projection */
  effectiveCac: Metric;
  breakdown: AcquisitionBreakdown;
  advisories: Advisory[];
}

export interface UnitEconomics {
  arpu: number;
  grossProfitPerCustomer: Metric;
  cac: Metric;
  ltv: Metric;
  ltvToCac: Metric;
  /** months for a customer to repay acquisition cost */
  paybackMonths: Metric;
}

export interface FinancialHealth {
  /** month-1 values (the next 30 days of activity) */
  revenue: number;
  grossProfit: number;
  smSpend: number;
  opex: number;
  netCashFlow: number;
  netBurn: number;
  /** cash ÷ net burn, in months */
  runwayMonths: Metric;
  /** month index where cash first goes negative, if it does */
  cashOutMonth: Metric;
  breakEvenMrr: Metric;
  breakEvenCustomers: Metric;
  monthsToBreakEven: Metric;
  profitableNow: boolean;
}

export interface BenchVerdict {
  id: string;
  label: string;
  /** the metric being judged */
  value: Metric;
  /** rendered value, e.g. "4.2x" */
  formatted: string;
  status: 'good' | 'ok' | 'weak' | 'na';
  /** e.g. "Healthy is 3x+" */
  guidance: string;
}

export interface Derived {
  today: MonthPoint;
  next: MonthPoint;
  unit: UnitEconomics;
  health: FinancialHealth;
  benchmarks: BenchVerdict[];
  /** customer growth vs last month, as a fraction */
  mrrGrowth: number | null;
  customerGrowth: number | null;
  netRetention: number | null;
}

export interface ScenarioResult {
  id: ScenarioId;
  label: string;
  description: string;
  model: Model;
  simulation: Simulation;
  derived: Derived;
  changes: ModelChange[];
}

export type ScenarioId = 'conservative' | 'base' | 'aggressive';

export interface ModelChange {
  field: NumericField;
  label: string;
  from: number;
  to: number;
  /** human-readable delta, e.g. "+1.2pp" or "−25%" */
  display: string;
  direction: 'up' | 'down';
}
