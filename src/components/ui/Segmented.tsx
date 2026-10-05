import type { KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  className?: string;
  /** stretch to the container width, sharing it evenly between options */
  fill?: boolean;
}

/**
 * A pressed-button group rather than ARIA tabs: these switch a view without
 * needing panel wiring, and every option stays keyboard reachable.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  fill,
}: SegmentedProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = options.length - 1;
    }

    const nextOption = options[nextIndex];
    if (nextOption) {
      onChange(nextOption.value);
      const container = event.currentTarget.parentElement;
      const buttons = container?.querySelectorAll<HTMLButtonElement>('button');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div role="group" aria-label={label} className={cx('seg', fill && 'flex w-full', className)}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          title={option.title}
          className={cx('seg-item', fill && 'flex-1')}
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
