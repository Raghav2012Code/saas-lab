/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PADDING: Padding = { top: 12, right: 14, bottom: 26, left: 46 };

export function linearScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const span = domainMax - domainMin;
  const safeSpan = span === 0 ? 1 : span;
  return (value: number) => rangeMin + ((value - domainMin) / safeSpan) * (rangeMax - rangeMin);
}

/**
 * A rounded axis domain plus the ticks inside it. Rounding to the step means
 * every series fits and both ends of the axis land on a gridline.
 */
export function niceDomain(
  min: number,
  max: number,
  count = 4,
): { domain: [number, number]; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { domain: [0, 1], ticks: [0, 1] };
  if (min === max) return { domain: [min, min + 1], ticks: [min, min + 1] };

  const rawStep = (max - min) / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const multiplier = normalized >= 7.5 ? 10 : normalized >= 3.5 ? 5 : normalized >= 1.5 ? 2 : 1;
  const step = multiplier * magnitude;

  const domainMin = Math.floor(min / step) * step;
  const domainMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = domainMin; value <= domainMax + step * 1e-6 && ticks.length < 14; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }

  return { domain: [domainMin, domainMax], ticks: ticks.length > 1 ? ticks : [domainMin, domainMax] };
}

/** An axis domain that contains every value, optionally anchored at zero. */
export function valueExtent(series: (number | null)[][], includeZero = true): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const values of series) {
    for (const value of values) {
      if (value === null || !Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) return [min, min + 1];

  const padding = (max - min) * 0.08;
  return [min === 0 ? 0 : min - padding, max + padding];
}

export function linePath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join(' ');
}

export function areaPath(points: readonly (readonly [number, number])[], baseline: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  return `${linePath(points)} L${last[0].toFixed(2)} ${baseline.toFixed(2)} L${first[0].toFixed(2)} ${baseline.toFixed(2)} Z`;
}

/** Index of the datum nearest a pixel position — used for hover and touch. */
export function nearestIndex(x: (index: number) => number, count: number, pixel: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < count; index += 1) {
    const distance = Math.abs(x(index) - pixel);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/** Chooses how many x labels to draw so they never collide. */
export function labelStride(count: number, width: number, perLabel = 54): number {
  const maxLabels = Math.max(2, Math.floor(width / perLabel));
  return Math.max(1, Math.ceil(count / maxLabels));
}

export function gridStroke(): string {
  return 'var(--grid)';
}

/** Series key. Swatches carry the colour so the labels stay readable. */
export function ChartLegend({
  items,
  className,
}: {
  items: { id: string; label: string; color: string; dashed?: boolean }[];
  className?: string;
}) {
  if (items.length < 2) return null;
  return (
    <ul className={cx('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-1.5 text-xs text-muted">
          <span
            className="h-0 w-3.5 border-t-2"
            style={{
              borderColor: item.color,
              borderTopStyle: item.dashed ? 'dashed' : 'solid',
            }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

interface AxesProps {
  width: number;
  height: number;
  padding: Padding;
  yTicks: number[];
  y: (value: number) => number;
  yFormat: (value: number) => string;
  labels: string[];
  x: (index: number) => number;
  stride: number;
  /** draws a stronger line at this value, e.g. zero or break-even */
  emphasis?: number | null;
}

/** Shared axis layer: horizontal grid, y labels, x labels. */
export function Axes({
  width,
  height,
  padding,
  yTicks,
  y,
  yFormat,
  labels,
  x,
  stride,
  emphasis,
}: AxesProps) {
  const plotRight = width - padding.right;
  const plotBottom = height - padding.bottom;

  return (
    <g aria-hidden="true">
      {yTicks.map((tick) => {
        const yPos = y(tick);
        if (yPos < padding.top - 1 || yPos > plotBottom + 1) return null;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={plotRight}
              y1={yPos}
              y2={yPos}
              stroke={gridStroke()}
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text
              x={padding.left - 8}
              y={yPos}
              textAnchor="end"
              dominantBaseline="middle"
              className="num fill-subtle text-[10px]"
            >
              {yFormat(tick)}
            </text>
          </g>
        );
      })}

      {emphasis !== undefined && emphasis !== null ? (
        <line
          x1={padding.left}
          x2={plotRight}
          y1={y(emphasis)}
          y2={y(emphasis)}
          stroke="var(--border-strong)"
          strokeWidth={1}
          strokeDasharray="3 3"
          shapeRendering="crispEdges"
        />
      ) : null}

      {labels.map((label, index) =>
        index % stride === 0 || index === labels.length - 1 ? (
          <text
            key={`${label}-${index}`}
            x={x(index)}
            y={plotBottom + 16}
            textAnchor="middle"
            className="num fill-subtle text-[10px]"
          >
            {label}
          </text>
        ) : null,
      )}
    </g>
  );
}

export interface TooltipItem {
  id: string;
  label: string;
  value: string;
  color?: string;
}

export function ChartTooltip({
  x,
  y,
  containerWidth,
  title,
  items,
}: {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  items: TooltipItem[];
}) {
  const width = 176;
  const flip = x + width / 2 + 12 > containerWidth;
  const left = flip ? undefined : x + 12;
  const right = flip ? containerWidth - x + 12 : undefined;

  return (
    <div
      className="chart-tip"
      style={{ left, right, top: Math.max(4, y - 8), width }}
      role="presentation"
    >
      <p className="num text-subtle">{title}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              {item.color ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
              ) : null}
              <span className="truncate text-muted">{item.label}</span>
            </span>
            <span className="num shrink-0 text-fg-strong">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The readout line above every chart. On narrow screens it is the only way to
 * read exact values, so it is always rendered — and being fixed-height it never
 * shifts the layout when its contents change.
 */
export function ChartReadout({ children, width }: { children: ReactNode; width: number }) {
  return (
    <div
      className={cx('num h-5 truncate text-xs text-muted', width < 520 && 'text-[11px]')}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
