import { useState } from 'react';

import { FIELD_SPECS_BY_KEY } from '../../engine/constants';
import { seekGoal as contractedSeekGoal } from '../../engine/goalSeek';
import type { NumericField } from '../../engine/types';
import { WHAT_IF_LEVERS } from '../../engine/whatIf';
import { formatFieldValue } from '../../lib/field-format';
import { useModel } from '../../state/store';
import { Button } from '../ui/Button';
import { InlineNote, Panel } from '../ui/Panel';

type GoalType = 'breakeven-by' | 'runway-floor';

interface Solution {
  field: NumericField;
  from: number;
  to: number;
}

/** The sibling-owned solver may expose its result with slight shape differences. */
function normalizeResult(raw: unknown): Solution | { unreachable: string } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.unreachable === 'string' && record.unreachable.length > 0) {
    return { unreachable: record.unreachable };
  }
  const { field, from, to } = record;
  if (
    typeof field === 'string' &&
    field in FIELD_SPECS_BY_KEY &&
    typeof from === 'number' &&
    Number.isFinite(from) &&
    typeof to === 'number' &&
    Number.isFinite(to)
  ) {
    return { field: field as NumericField, from, to };
  }
  return null;
}

/**
 * "What would it take" panel. Solving previews the answer as a ghost through
 * the existing what-if levers, so Apply / Discard stay in the shared banner.
 */
export function GoalSeekPanel() {
  const { model, fmt, setLever, resetLevers, update } = useModel();
  const [goalType, setGoalType] = useState<GoalType>('breakeven-by');
  const [month, setMonth] = useState(12);
  const [months, setMonths] = useState(18);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [fallback, setFallback] = useState<Solution | null>(null);
  const [unreachable, setUnreachable] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  /** A found answer that maps onto a lever previews as a ghost; else local Apply. */
  function previewSolution(found: Solution) {
    const lever = WHAT_IF_LEVERS.find(
      (candidate) =>
        (!candidate.visible || candidate.visible(model)) && candidate.field(model) === found.field,
    );
    if (lever) {
      // A scale lever on a zero base has no meaningful ratio — fall through
      // to the local Apply path instead of previewing a silent no-op.
      const value =
        lever.kind === 'absolute'
          ? found.to
          : Math.abs(found.from) > 1e-9
            ? found.to / found.from
            : NaN;
      if (Number.isFinite(value)) {
        resetLevers();
        setLever(lever.id, value);
        setSolution(found);
        setFallback(null);
        return;
      }
    }
    resetLevers();
    setSolution(null);
    setFallback(found);
  }

  function solve() {
    setSolution(null);
    setFallback(null);
    setUnreachable(null);
    setFailed(false);
    const goal =
      goalType === 'breakeven-by'
        ? { type: 'breakeven-by', month } as const
        : { type: 'runway-floor', months } as const;
    let raw: unknown;
    try {
      // Thin adapter: never crash if the sibling's export shape drifts slightly.
      const solver =
        typeof contractedSeekGoal === 'function'
          ? contractedSeekGoal
          : (contractedSeekGoal as unknown as { seekGoal?: unknown; default?: unknown });
      const fn =
        typeof solver === 'function'
          ? (solver as (model: unknown, goal: unknown) => unknown)
          : typeof (solver as { seekGoal?: unknown }).seekGoal === 'function'
            ? ((solver as { seekGoal: (model: unknown, goal: unknown) => unknown }).seekGoal)
            : typeof (solver as { default?: unknown }).default === 'function'
              ? ((solver as { default: (model: unknown, goal: unknown) => unknown }).default)
              : null;
      if (!fn) {
        setFailed(true);
        return;
      }
      raw = fn(model, goal);
    } catch {
      setFailed(true);
      return;
    }
    const normalized = normalizeResult(raw);
    if (!normalized) {
      setFailed(true);
    } else if ('unreachable' in normalized) {
      setUnreachable(normalized.unreachable);
    } else {
      previewSolution(normalized);
    }
  }

  function discard() {
    resetLevers();
    setSolution(null);
    setFallback(null);
  }

  const shown = solution ?? fallback;
  const spec = shown ? FIELD_SPECS_BY_KEY[shown.field] : null;

  return (
    <Panel
      title="What would it take"
      description="Pick a goal and the panel finds the one change that reaches it. The answer previews as a what-if — nothing is saved until you apply it."
    >
      <fieldset>
        <legend className="sr-only">Goal</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-6 cursor-pointer items-center gap-2 text-sm text-fg">
            <input
              type="radio"
              name="goalseek-goal"
              value="breakeven-by"
              className="size-4"
              checked={goalType === 'breakeven-by'}
              onChange={() => {
                setGoalType('breakeven-by');
                setSolution(null);
                setFallback(null);
                setUnreachable(null);
              }}
            />
            Break-even by month
          </label>
          <label className="flex min-h-6 cursor-pointer items-center gap-2 text-sm text-fg">
            <input
              type="radio"
              name="goalseek-goal"
              value="runway-floor"
              className="size-4"
              checked={goalType === 'runway-floor'}
              onChange={() => {
                setGoalType('runway-floor');
                setSolution(null);
                setFallback(null);
                setUnreachable(null);
              }}
            />
            Runway of at least
          </label>
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {goalType === 'breakeven-by' ? (
          <label className="text-sm text-muted">
            Month
            <input
              type="number"
              className="num ml-2 w-24 rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-fg"
              min={1}
              max={36}
              step={1}
              value={month}
              onChange={(event) => setMonth(Math.trunc(Number(event.target.value)) || 1)}
            />
          </label>
        ) : (
          <label className="text-sm text-muted">
            Months of runway
            <input
              type="number"
              className="num ml-2 w-24 rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-fg"
              min={1}
              max={36}
              step={1}
              value={months}
              onChange={(event) => setMonths(Math.trunc(Number(event.target.value)) || 1)}
            />
          </label>
        )}
        <Button variant="primary" size="sm" onClick={solve}>
          Solve
        </Button>
      </div>

      <div className="mt-3">
        {shown && spec ? (
          <p className="text-sm text-fg">
            <span className="num">{formatFieldValue(spec, shown.from, fmt)}</span>
            {' → '}
            <span className="num font-medium">{formatFieldValue(spec, shown.to, fmt)}</span>
            <span className="text-muted">
              {' — '}{spec.label}, previewing as a what-if{fallback ? '' : '; apply or discard above'}.
            </span>
            {fallback ? (
              <span className="ml-2 inline-flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    update({ [fallback.field]: fallback.to } as Partial<typeof model>);
                    setFallback(null);
                  }}
                >
                  Apply
                </Button>
                <Button size="sm" onClick={discard}>
                  Discard
                </Button>
              </span>
            ) : (
              <span className="ml-2">
                <Button size="sm" onClick={discard}>
                  Discard
                </Button>
              </span>
            )}
          </p>
        ) : unreachable ? (
          <InlineNote tone="warn">
            No single change reaches that goal — {unreachable}
          </InlineNote>
        ) : failed ? (
          <InlineNote>The solver is unavailable right now — try again later.</InlineNote>
        ) : (
          <InlineNote>
            {goalType === 'breakeven-by'
              ? `Finds the one change that breaks even by month ${month}.`
              : `Finds the one change that leaves at least ${months} months of runway.`}
          </InlineNote>
        )}
      </div>
    </Panel>
  );
}
