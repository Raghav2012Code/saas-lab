import { cx } from '../../lib/cx';
import type { IconName } from './Icon';
import { Icon } from './Icon';

export type PillTone = 'neutral' | 'good' | 'warn' | 'bad' | 'brand' | 'ghost';

export function Pill({
  tone = 'neutral',
  icon,
  className,
  title,
  children,
}: {
  tone?: PillTone;
  icon?: IconName;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cx('pill', `pill-${tone}`, className)} title={title}>
      {icon ? <Icon name={icon} size={11} /> : null}
      {children}
    </span>
  );
}

/** Small delta chip: "+8.1%" with a direction arrow. Never colour-only. */
export function DeltaPill({
  value,
  text,
  /** true when a rise is the good outcome */
  higherIsBetter = true,
  tone,
}: {
  value: number | null;
  text: string;
  higherIsBetter?: boolean;
  tone?: PillTone;
}) {
  if (value === null || !Number.isFinite(value)) {
    return <Pill tone="neutral">no change</Pill>;
  }

  const rising = value > 0;
  const flat = Math.abs(value) < 1e-9;
  const resolved: PillTone = tone ?? (flat ? 'neutral' : rising === higherIsBetter ? 'good' : 'bad');

  return (
    <Pill tone={resolved} icon={flat ? undefined : rising ? 'arrowUp' : 'arrowDown'}>
      {text}
    </Pill>
  );
}
