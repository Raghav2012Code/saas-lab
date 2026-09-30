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
  return (
    <div role="group" aria-label={label} className={cx('seg', fill && 'flex w-full', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          title={option.title}
          className={cx('seg-item', fill && 'flex-1')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
