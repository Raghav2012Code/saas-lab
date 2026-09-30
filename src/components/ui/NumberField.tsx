import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { Formatters } from '../../engine/format';
import { clamp, round } from '../../engine/math';
import type { FieldSpec } from '../../engine/types';
import { fieldWarning, parseNumericInput } from '../../engine/validate';
import { formatFieldValue } from '../../lib/field-format';
import { cx } from '../../lib/cx';
import { Icon } from './Icon';
import { InfoTip } from './InfoTip';

/** Pixels of drag per scrub step. Tuned so every field feels deliberate. */
const PIXELS_PER_STEP = 4;

interface NumberFieldProps {
  spec: FieldSpec;
  value: number;
  fmt: Formatters;
  onCommit: (value: number) => void;
  /** namespaces element ids so the desktop rail and the mobile drawer never collide */
  idPrefix: string;
}

function rawText(value: number): string {
  return String(round(value, 4));
}

/**
 * One assumption. The label is a drag-scrub handle (arrow keys work too) and
 * the input accepts typed values. Every change commits immediately, because the
 * whole point of the app is watching the model react.
 */
export function NumberField({ spec, value, fmt, onCommit, idPrefix }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const scrubState = useRef<{ x: number; from: number; scale: number; moved: boolean } | null>(null);
  const inputId = `${idPrefix}-${spec.key}`;

  const warning = fieldWarning(spec, value);
  const display = draft ?? rawText(value);

  // Percent fields already carry their unit inside the input, so no echo.
  const echo = spec.unit === 'percent' ? null : formatFieldValue(spec, value, fmt);

  const step = (direction: 1 | -1, big: boolean) => {
    const delta = spec.scrub * (big ? 10 : 1) * direction;
    setError(null);
    setDraft(null);
    onCommit(round(clamp(value + delta, spec.min, spec.max), 4));
  };

  const tryCommit = (text: string) => {
    const parsed = parseNumericInput(text);
    if (parsed === null) {
      setError(null);
      setDraft(null);
      return;
    }
    if (parsed < spec.min || parsed > spec.max) {
      setError(`Between ${fmt.number(spec.min)} and ${fmt.number(spec.max)}.`);
      return;
    }
    setError(null);
    setDraft(null);
    onCommit(parsed);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLLabelElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    scrubState.current = { x: event.clientX, from: value, scale: event.shiftKey ? 0.2 : 1, moved: false };
    setScrubbing(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLLabelElement>) => {
    const state = scrubState.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) < 3) return;
    state.moved = true;
    const steps = Math.round(dx / PIXELS_PER_STEP);
    setDraft(null);
    onCommit(round(clamp(state.from + steps * spec.scrub * state.scale, spec.min, spec.max), 4));
  };

  const endScrub = (event: ReactPointerEvent<HTMLLabelElement>) => {
    if (!scrubState.current) return;
    scrubState.current = null;
    setScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={cx('field', scrubbing && 'scrub-active')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <label
            htmlFor={inputId}
            className="scrub field-label truncate"
            title="Drag to change, or type a value"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
          >
            {spec.label}
          </label>
          <InfoTip label={spec.label}>
            <span className="block font-medium text-fg-strong">{spec.hint}</span>
            <span className="mt-1 block text-muted">{spec.detail}</span>
            <span className="mt-1 block text-muted">
              Drag the label to scrub, or type a value and use the arrow keys.
            </span>
          </InfoTip>
        </div>
        {echo ? (
          <span className="num shrink-0 text-xs text-subtle" aria-hidden="true">
            {echo}
          </span>
        ) : null}
      </div>

      <div className="field-control" data-invalid={error ? 'true' : 'false'}>
        {spec.unit === 'currency' ? <span className="field-affix">{fmt.symbol}</span> : null}
        <input
          id={inputId}
          className="field-input"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : warning ? `${inputId}-note` : undefined}
          value={display}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => tryCommit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              tryCommit(event.currentTarget.value);
              event.currentTarget.blur();
            } else if (event.key === 'Escape') {
              setDraft(null);
              setError(null);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              step(1, event.shiftKey);
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              step(-1, event.shiftKey);
            }
          }}
        />
        {spec.suffix ? <span className="field-affix">{spec.suffix}</span> : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="flex items-center gap-1 text-xs text-danger">
          <Icon name="warning" size={12} />
          {error}
        </p>
      ) : warning ? (
        <p id={`${inputId}-note`} className="flex items-start gap-1 text-xs text-accent-fg">
          <span className="mt-0.5">
            <Icon name="warning" size={12} />
          </span>
          {warning}
        </p>
      ) : null}
    </div>
  );
}
