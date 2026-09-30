import { useId } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from './Icon';

interface SliderProps {
  label: string;
  /** formatted value the slider is currently set to */
  display: string;
  /** formatted value it would take if the lever were neutral */
  baselineDisplay: string;
  value: number;
  baseline: number;
  min: number;
  max: number;
  step: number;
  active: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
}

/**
 * What-if lever. A native range input, so it is keyboard- and touch-friendly by
 * default; a notch marks the neutral position so the starting point is visible.
 */
export function Slider({
  label,
  display,
  baselineDisplay,
  value,
  baseline,
  min,
  max,
  step,
  active,
  onChange,
  onReset,
}: SliderProps) {
  const id = useId();
  const notch = ((baseline - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="min-w-0 truncate text-sm font-medium text-fg">
          {label}
        </label>
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className={cx('num text-sm', active ? 'text-accent-fg' : 'text-fg')}>{display}</span>
          {active ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-6 w-6 items-center justify-center text-subtle transition-colors hover:text-fg"
              aria-label={`Reset ${label} to ${baselineDisplay}`}
              title={`Reset to ${baselineDisplay}`}
            >
              <Icon name="reset" size={13} />
            </button>
          ) : null}
        </span>
      </div>

      <div className="relative flex h-8 items-center">
        <span
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line-strong"
          style={{ left: `calc(${Math.min(Math.max(notch, 0), 100)}% - 0.5px)` }}
          aria-hidden="true"
        />
        <input
          id={id}
          type="range"
          className="range"
          min={min}
          max={max}
          step={step}
          value={value}
          data-active={active ? 'true' : 'false'}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
