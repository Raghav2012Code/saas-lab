import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from './Icon';
import { InfoTip } from './InfoTip';
import { Pill, type PillTone } from './Pill';

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** removes the body padding, for charts and tables */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** The one bordered container in the app. Used for charts, tables and tools. */
export function Panel({ title, description, actions, flush, className, bodyClassName, children }: PanelProps) {
  const hasHead = Boolean(title || description || actions);
  return (
    <section className={cx('panel', className)}>
      {hasHead ? (
        <header className="panel-head">
          <div className="min-w-0">
            {title ? <h3 className="text-base font-semibold text-fg-strong">{title}</h3> : null}
            {description ? <p className="mt-0.5 max-w-prose text-sm text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx(flush ? 'panel-body-flush' : 'panel-body', bodyClassName)}>{children}</div>
    </section>
  );
}

/** A group heading with no chrome around it, so not every section is a card. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="label-xs">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold text-fg-strong">{title}</h2>
        {description ? <p className="mt-1 max-w-prose text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

/** Label/value line for dense figures, with an optional explanation. */
export function StatRow({
  label,
  value,
  note,
  detail,
  tone = 'default',
  strong,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'muted' | 'good' | 'bad' | 'accent';
  strong?: boolean;
}) {
  const toneClass =
    tone === 'good'
      ? 'text-success'
      : tone === 'bad'
        ? 'text-danger'
        : tone === 'accent'
          ? 'text-accent-fg'
          : tone === 'muted'
            ? 'text-muted'
            : 'text-fg';

  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="flex items-center gap-1 text-sm text-muted">
        {label}
        {detail ? <InfoTip label={label}>{detail}</InfoTip> : null}
      </span>
      <span className="flex items-baseline gap-2 text-right">
        <span className={cx('num text-base', strong && 'font-medium', toneClass)}>{value}</span>
        {note ? <span className="text-xs text-subtle">{note}</span> : null}
      </span>
    </div>
  );
}

/** An inline, non-alarming note — used instead of a fabricated number. */
export function InlineNote({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: 'neutral' | 'warn' | 'accent';
  icon?: IconName;
  children: ReactNode;
}) {
  const resolvedIcon = icon ?? (tone === 'neutral' ? 'info' : 'warning');
  return (
    <p
      className={cx(
        'flex items-start gap-1.5 text-xs leading-relaxed',
        tone === 'warn' ? 'text-accent-fg' : 'text-muted',
      )}
    >
      <span className="mt-0.5">
        <Icon name={resolvedIcon} size={13} />
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** Renders a metric that could not be computed, with the reason why. */
export function NotApplicable({ reason, className }: { reason?: string; className?: string }) {
  const text = reason ?? 'Not available with these assumptions.';
  return (
    <span className={cx('inline-flex items-center gap-1.5', className)}>
      <span className="num text-base text-subtle">&mdash;</span>
      <Pill tone="neutral">Not applicable</Pill>
      <InfoTip label="Why this is not available">{text}</InfoTip>
    </span>
  );
}

export type { PillTone };
