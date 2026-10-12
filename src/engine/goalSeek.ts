import { FIELD_SPECS_BY_KEY, MAX_MONTHS } from './constants';
import { clamp, finite } from './math';
import { acquisitionDriverField, cacDriverField, simulate } from './model';
import { derive } from './metrics';
import type { Model, NumericField } from './types';

/** The two goals the seeker can aim at. */
export type Goal = { type: 'breakeven-by'; month: number } | { type: 'runway-floor'; months: number };

/** The single input change that gets there. */
export interface GoalHit {
  field: NumericField;
  from: number;
  to: number;
}

/** No lever within its valid range gets there. */
export interface GoalMiss {
  unreachable: string;
}

export type GoalResult = GoalHit | GoalMiss;

/**
 * Pure, deterministic goal-seeking: which SINGLE input change achieves `goal`.
 * Tries levers in fixed priority order (churn, pricing, acquisition volume,
 * CAC/spend, operating expenses), solving each by bisection over its valid
 * spec range through the real simulation, and returns the feasible change
 * with the smallest relative change. Read-only: never mutates `model`.
 */
export function seekGoal(model: Model, goal: Goal): GoalResult {
  const target = normalizeGoal(goal);
  if (meetsGoal(model, target)) {
    return {
      unreachable:
        target.type === 'breakeven-by'
          ? `Already breaking even by month ${target.month} — no change needed.`
          : `Already meets a ${target.months}-month runway floor — no change needed.`,
    };
  }

  // Fixed priority order; ties keep the earlier lever.
  const levers: NumericField[] = [
    'monthlyChurnPct',
    'arpu',
    acquisitionDriverField(model),
    cacDriverField(model),
    'monthlyOpex',
  ];

  let best: GoalHit | null = null;
  let bestRel = Infinity;
  for (const field of levers) {
    const solved = solveLever(model, field, target);
    if (!solved) continue;
    const rel = relativeChange(solved.from, solved.to);
    if (!(rel < bestRel)) continue;
    best = solved;
    bestRel = rel;
  }

  if (!best) {
    return {
      unreachable:
        target.type === 'breakeven-by'
          ? `No single input within its valid range reaches break-even by month ${target.month}, even at its extreme.`
          : `No single input within its valid range stretches runway to ${target.months} months, even at its extreme.`,
    };
  }
  return best;
}

type NormalizedGoal = { type: 'breakeven-by'; month: number } | { type: 'runway-floor'; months: number };

function normalizeGoal(goal: Goal): NormalizedGoal {
  if (goal.type === 'breakeven-by') {
    return { type: 'breakeven-by', month: clamp(Math.round(finite(goal.month, MAX_MONTHS)), 1, MAX_MONTHS) };
  }
  return { type: 'runway-floor', months: clamp(Math.round(finite(goal.months, MAX_MONTHS)), 0, MAX_MONTHS) };
}

function meetsGoal(model: Model, goal: NormalizedGoal): boolean {
  const simulation = simulate(model, MAX_MONTHS);
  const derived = derive(model, simulation);
  if (goal.type === 'breakeven-by') {
    if (derived.health.profitableNow) return true;
    const months = derived.health.monthsToBreakEven.value;
    return months !== null && Number.isFinite(months) && months <= goal.month;
  }
  // Null runway means cash never depletes, so any floor is met.
  const runway = derived.health.runwayMonths.value;
  if (runway === null) return true;
  return Number.isFinite(runway) && (runway as number) >= goal.months;
}

/**
 * Bisect one lever between its current value and the helpful extreme
 * (min for costs/churn, max for pricing/volume). Returns null when even the
 * extreme fails, so the lever is infeasible.
 */
function solveLever(model: Model, field: NumericField, goal: NormalizedGoal): GoalHit | null {
  const spec = FIELD_SPECS_BY_KEY[field];
  const from = clamp(finite(model[field]), spec.min, spec.max);
  const down = field === 'monthlyChurnPct' || field === 'monthlyOpex' || field === 'monthlySmSpend' || field === 'cac';
  const extreme = down ? spec.min : spec.max;
  if (from === extreme) return null;
  const withValue = (value: number): Model => ({ ...model, [field]: clamp(value, spec.min, spec.max) });
  if (!meetsGoal(withValue(extreme), goal)) return null;

  // `bad` fails (the base does — checked by the caller), `good` passes.
  let bad = from;
  let good = extreme;
  for (let i = 0; i < 60; i += 1) {
    const mid = (bad + good) / 2;
    if (!Number.isFinite(mid) || mid === bad || mid === good) break;
    if (meetsGoal(withValue(mid), goal)) good = mid;
    else bad = mid;
  }
  if (!Number.isFinite(good) || good === from) return null;
  return { field, from, to: good };
}

/** |to − from| ÷ |from|; a zero base counts as a 100% change when it moves. */
function relativeChange(from: number, to: number): number {
  if (from === to) return 0;
  const base = Math.abs(from) > 1e-12 ? Math.abs(from) : Math.abs(to);
  if (!(base > 0)) return 0;
  const rel = Math.abs(to - from) / base;
  return Number.isFinite(rel) ? rel : Infinity;
}
