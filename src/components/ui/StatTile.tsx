import type { ReactNode } from 'react';

import { copyText } from '../../engine/export';
import { cx } from '../../lib/cx';
import { useToast } from '../../state/toast';
import { Icon } from './Icon';
import { InfoTip } from './InfoTip';
import { DeltaPill, Pill } from './Pill';

export interface BenchmarkBadge {
  status: 'good' | 'ok' | 'weak' | 'na';
  guidance: string;
}

const BENCH_LABEL: Record<BenchmarkBadge['status'], string | null> = {
  good: 'Strong',
  ok: 'Typical',
  weak: 'Below range',
  na: null,
};

interface StatTileProps {
  label: string;
  /** the committed value, already formatted */
  display: string;
  /** what the value would be under the current what-if, if one is running */
  previewDisplay?: string | null;
  /** plain text copied to the clipboard */
  copyValue: string;
  detail?: ReactNode;
  caption?: string;
  delta?: { value: number | null; text: string; higherIsBetter?: boolean };
  /** change versus the committed model, shown only while a what-if is running */
  previewDelta?: { value: number | null; text: string; higherIsBetter?: boolean };
  benchmark?: BenchmarkBadge;
  size?: 'lg' | 'md';
  /** shown when the metric cannot be computed */
  reason?: string;
  /** a word instead of a number, when the metric is not a quantity (e.g. "Profitable") */
  word?: string;
}

export function StatTile({
  label,
  display,
  previewDisplay,
  copyValue,
  detail,
  caption,
  delta,
  previewDelta,
  benchmark,
  size = 'md',
  reason,
  word,
}: StatTileProps) {
  const { notify } = useToast();
  const previewing = Boolean(previewDisplay);

  const onCopy = async () => {
    const ok = await copyText(copyValue);
    notify(ok ? `${label} copied` : 'Could not copy to the clipboard', ok ? 'neutral' : 'error');
  };

  const benchLabel = benchmark ? BENCH_LABEL[benchmark.status] : null;
  const hasMeta = Boolean(reason || previewing || word || (!delta && caption) || benchLabel || (delta && !reason));
  // Steps down at the narrowest widths so a hero figure can never outgrow its tile.
  const valueSize =
    size === 'lg'
      ? 'text-lg min-[380px]:text-xl sm:text-2xl lg:text-3xl'
      : 'text-base min-[380px]:text-lg sm:text-xl';

  return (
    <div className="flex min-w-0 flex-col gap-1.5 py-4">
      <div className="flex items-start gap-1">
        <span className="label-xs min-w-0 text-pretty">{label}</span>
        {detail ? <InfoTip label={label}>{detail}</InfoTip> : null}
      </div>

      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}: ${(previewing ? previewDisplay : display) ?? display}`}
        title={`Click to copy ${label}`}
        className="group flex min-h-6 items-baseline gap-1.5 text-left"
      >
        {word && !previewing ? (
          <span className={cx('font-medium text-success', valueSize)}>{word}</span>
        ) : (
          <span
            className={cx(
              'num font-medium',
              valueSize,
              reason ? 'text-subtle' : previewing ? 'ghost-value' : 'text-fg-strong',
            )}
          >
            {previewing ? previewDisplay : reason ? '\u2014' : display}
          </span>
        )}
        <span className="text-subtle opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70">
          <Icon name="copy" size={13} />
        </span>
      </button>

      <div className={`flex min-h-[20px] flex-wrap items-center gap-x-2 gap-y-1 ${hasMeta ? '' : 'hidden'}`}>
        {reason && !previewing ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Pill tone="neutral">Not applicable</Pill>
            <InfoTip label={label}>{reason}</InfoTip>
          </span>
        ) : null}

        {previewing ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Pill tone="ghost">what if</Pill>
            <span className="num text-subtle">now {display}</span>
          </span>
        ) : null}

        {!reason && previewing && previewDelta ? (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
            <DeltaPill value={previewDelta.value} text={previewDelta.text} higherIsBetter={previewDelta.higherIsBetter ?? true} />
            <span>vs your model</span>
          </span>
        ) : null}

        {!reason && !previewing && delta ? (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
            <DeltaPill
              value={delta.value}
              text={delta.text}
              higherIsBetter={delta.higherIsBetter ?? true}
            />
            {caption ? <span>{caption}</span> : null}
          </span>
        ) : null}

        {!reason && !previewing && !delta && caption ? <span className="text-xs text-muted">{caption}</span> : null}

        {benchLabel ? (
          <InfoTip label={`${label} benchmark`}>
            <span className="block font-medium text-fg-strong">{benchLabel}</span>
            <span className="mt-1 block text-muted">{benchmark?.guidance}</span>
          </InfoTip>
        ) : null}
      </div>
    </div>
  );
}
