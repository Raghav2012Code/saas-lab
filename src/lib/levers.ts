import type { Formatters } from '../engine/format';
import type { Metric, Model } from '../engine/types';
import { leverValue, visibleLevers, type LeverValues } from '../engine/whatIf';

export interface LeverDescription {
  id: string;
  label: string;
  text: string;
}

/** "Churn 3.2% → 5.0%", "Pricing ×1.20" — what the active levers actually do. */
export function leverDescriptions(
  model: Model,
  levers: LeverValues,
  fmt: Formatters,
): LeverDescription[] {
  return visibleLevers(model).flatMap((lever) => {
    const override = levers[lever.id];
    if (override === null || override === undefined) return [];
    const baseline = leverValue(lever, model, { [lever.id]: null });

    if (lever.kind === 'absolute') {
      if (Math.abs(override - baseline) < 1e-9) return [];
      return [
        {
          id: lever.id,
          label: lever.label,
          text:
            lever.unit === 'percent'
              ? `${lever.label} ${fmt.percent(baseline)} → ${fmt.percent(override)}`
              : `${lever.label} ${override}`,
        },
      ];
    }

    if (Math.abs(override - 1) < 1e-9) return [];
    return [
      {
        id: lever.id,
        label: lever.label,
        text: `${lever.label} ×${override.toFixed(2)}`,
      },
    ];
  });
}

/** Renders a Metric, falling back to the reason it is unavailable. */
export function present(
  metric: Metric,
  render: (value: number) => string,
): { display: string; reason?: string } {
  if (metric.value === null) return { display: '\u2014', reason: metric.reason };
  return { display: render(metric.value) };
}
