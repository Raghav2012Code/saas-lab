import { useId } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from './Icon';

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  /** visible text label; omit and pass `label` instead for an icon-only control */
  ariaLabel: string;
  visibleLabel?: string;
  className?: string;
}

/**
 * A native select, styled to match the inputs. It is the right control here:
 * platform pickers on mobile, full keyboard support, no custom popover.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  visibleLabel,
  className,
}: SelectProps<T>) {
  const id = useId();
  return (
    <div className={cx('flex items-center gap-1.5', className)}>
      {visibleLabel ? (
        <label htmlFor={id} className="text-xs font-medium text-subtle">
          {visibleLabel}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={id}
          aria-label={ariaLabel}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="h-8 min-w-[5.5rem] cursor-pointer appearance-none rounded-sm border border-line-strong bg-surface pl-2.5 pr-7 text-sm font-medium text-fg transition-colors hover:border-subtle focus:border-brand focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-subtle">
          <Icon name="chevronDown" size={14} />
        </span>
      </div>
    </div>
  );
}
