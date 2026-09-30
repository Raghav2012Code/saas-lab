import { Icon } from '../ui/Icon';

export interface FunnelStage {
  id: string;
  label: string;
  value: number;
  formatted: string;
  /** short note, e.g. the rate that produces this stage from the previous one */
  note?: string;
}

/**
 * Acquisition funnel. Built from plain elements rather than SVG so it stays
 * legible at any width and can carry real labels.
 *
 * Bar widths are logarithmic and the chart says so. A funnel that runs from
 * 12,000 visitors to 42 customers spans three orders of magnitude, and a linear
 * axis would render the last two stages as invisible slivers — a lying picture
 * dressed up as an honest one.
 */
export function FunnelChart({ stages, ariaLabel }: { stages: FunnelStage[]; ariaLabel: string }) {
  const max = Math.max(...stages.map((stage) => stage.value), 1);
  const logMax = Math.log10(1 + max);

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-col">
      {stages.map((stage, index) => {
        const share = Math.max(0.03, Math.min(1, Math.log10(1 + Math.max(stage.value, 0)) / logMax));
        const previous = stages[index - 1];
        return (
          <div key={stage.id}>
            {previous ? (
              <div className="flex items-center gap-1.5 py-1 pl-1 text-xs text-subtle">
                <Icon name="arrowDown" size={11} />
                <span className="num">{stage.note}</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-1 py-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-muted">{stage.label}</span>
                <span className="num text-base text-fg-strong">{stage.formatted}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${share * 100}%`,
                    backgroundColor: `var(--series-${Math.min(index + 1, 4)})`,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-xs text-subtle">
        Bar widths are logarithmic — this funnel is far too wide to draw to scale.
      </p>
    </div>
  );
}
