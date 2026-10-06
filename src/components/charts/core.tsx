/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from '../ui/Icon';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PADDING: Padding = { top: 12, right: 14, bottom: 26, left: 46 };

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

/**
 * Converts a viewport X coordinate into the SVG's own coordinate space.
 *
 * `x()` in these charts returns SVG user units relative to the SVG's origin, so
 * a raw `clientX - rect.left` only lines up when the SVG is rendered at exactly
 * its viewBox width. `max-w-full` can scale it down, and subtracting rect.left
 * from a user-unit value silently collapses the mapping to the last datum — so
 * every chart goes through here.
 */
export function toUserX(clientX: number, rect: DOMRect | { left: number; width: number }, userWidth: number): number {
  const rendered = rect.width > 0 ? rect.width : userWidth;
  return (clientX - rect.left) * (userWidth / rendered);
}

/** Chooses how many x labels to draw so they never collide. */
export function labelStride(count: number, width: number, perLabel = 54): number {
  const maxLabels = Math.max(2, Math.floor(width / perLabel));
  return Math.max(1, Math.ceil(count / maxLabels));
}

/**
 * Clamps a tooltip so it always stays inside the chart, on both axes, whatever
 * the chart's width. Returns a CSS translate and left/top in container pixels.
 */
export function tooltipPlacement(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number,
  cardWidth = 208,
  cardHeight = 96,
): { left: number; top: number; flip: boolean } {
  const margin = 8;
  const flip = x + margin + cardWidth > containerWidth;
  const left = Math.min(
    Math.max(flip ? x - margin - cardWidth : x + margin, margin),
    Math.max(margin, containerWidth - cardWidth - margin),
  );
  const top = Math.min(Math.max(y, margin), Math.max(margin, containerHeight - cardHeight - margin));
  return { left, top, flip };
}

/** Series key. Doubles as the series toggle when `onToggle` is supplied. */
export function ChartLegend({
  items,
  className,
  onToggle,
  hidden = [],
}: {
  items: { id: string; label: string; color: string; dashed?: boolean }[];
  className?: string;
  /** when present, each key becomes a show/hide toggle */
  onToggle?: (id: string) => void;
  hidden?: string[];
}) {
  if (items.length < 2) return null;

  return (
    <ul className={cx('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {items.map((item) => {
        const off = hidden.includes(item.id);
        const body = (
          <>
            <span
              className="h-0 w-3.5 border-t-2"
              style={{
                borderColor: off ? 'var(--subtle)' : item.color,
                borderTopStyle: item.dashed ? 'dashed' : 'solid',
              }}
              aria-hidden="true"
            />
            <span className={cx(off && 'line-through')}>{item.label}</span>
          </>
        );

        return (
          <li key={item.id}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!off}
                onClick={() => onToggle(item.id)}
                title={off ? `Show ${item.label}` : `Hide ${item.label}`}
                className={cx(
                  'flex items-center gap-1.5 rounded-sm px-1 text-xs transition-colors',
                  off ? 'text-subtle' : 'text-muted',
                  'hover:bg-surface-2 hover:text-fg focus-visible:bg-surface-2',
                )}
              >
                {body}
              </button>
            ) : (
              <span className={cx('flex items-center gap-1.5 text-xs', off ? 'text-subtle' : 'text-muted')}>
                {body}
              </span>
            )}
          </li>
        );
      })}
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
              stroke="var(--grid)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text
              x={padding.left - 8}
              y={yPos}
              textAnchor="end"
              dominantBaseline="middle"
              className="num fill-subtle text-[11px]"
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
            className="num fill-subtle text-[11px]"
          >
            {label}
          </text>
        ) : null,
      )}
    </g>
  );
}

/**
 * The vertical strip behind the hovered column. It is the thing that makes a
 * chart read as interactive: without it a tooltip appears from nowhere.
 */
export function HoverBand({
  x,
  width,
  top,
  height,
}: {
  x: number;
  width: number;
  top: number;
  height: number;
}) {
  return (
    <rect
      x={x - width / 2}
      y={top}
      width={Math.max(2, width)}
      height={height}
      fill="var(--surface-2)"
      opacity={0.85}
      aria-hidden="true"
    />
  );
}

export interface TooltipItem {
  id: string;
  label: string;
  value: string;
  color?: string;
  /** change versus the previous period, already formatted */
  change?: string | null;
  /** true when a fall is the good outcome */
  lowerIsBetter?: boolean;
}

interface TooltipSource {
  id: string;
  label: string;
  color: string;
  values: (number | null)[];
}

/** Readout rows for one period: exact values plus the move since the previous. */
export function tooltipItems(
  shown: TooltipSource[],
  index: number,
  valueFormat: (value: number) => string,
  changeFormat: ((value: number) => string) | undefined,
  colorOf?: (item: TooltipSource, value: number | null | undefined) => string,
): TooltipItem[] {
  return shown.map((item) => {
    const value = item.values[index];
    const previous = index > 0 ? item.values[index - 1] : null;
    let change: string | null = null;
    if (changeFormat && value !== null && value !== undefined && previous !== null && previous !== undefined) {
      const delta = value - previous;
      if (Math.abs(delta) > 1e-9) change = `${delta > 0 ? '+' : '-'}${changeFormat(Math.abs(delta))}`;
    }
    return {
      id: item.id,
      label: item.label,
      value: value === null || value === undefined ? '\u2014' : valueFormat(value),
      color: colorOf ? colorOf(item, value) : item.color,
      change,
      lowerIsBetter: false,
    };
  });
}

/**
 * The readout card. It carries the period, every series at that period, and the
 * movement since the period before — which is what you actually want to know
 * when you stop on a point.
 */
export function ChartTooltip({
  left,
  top,
  title,
  subtitle,
  items,
  pinned,
}: {
  left: number;
  top: number;
  title: string;
  subtitle?: string;
  items: TooltipItem[];
  pinned?: boolean;
}) {
  return (
    <div
      className="chart-tip"
      style={{ left, top, width: 208 }}
      role="presentation"
      data-pinned={pinned ? 'true' : 'false'}
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="num text-xs font-medium text-fg-strong">{title}</span>
        {pinned ? (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-accent-fg">
            <Icon name="pin" size={10} />
            pinned
          </span>
        ) : null}
      </p>
      {subtitle ? <p className="num text-[11px] text-subtle">{subtitle}</p> : null}

      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-baseline gap-1.5">
              {item.color ? (
                <span
                  className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
              ) : null}
              <span className="truncate text-muted">{item.label}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-1.5">
              <span className="num text-fg-strong">{item.value}</span>
              {item.change ? (
                <span
                  className={cx(
                    'num text-[10px]',
                    item.change.startsWith('-')
                      ? item.lowerIsBetter
                        ? 'text-success'
                        : 'text-danger'
                      : item.lowerIsBetter
                        ? 'text-danger'
                        : 'text-success',
                  )}
                >
                  {item.change}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The line under every chart. On a narrow chart it is the only place the exact
 * values appear, so it is always rendered — and being fixed-height it never
 * shifts the layout. It doubles as the pin indicator.
 */
export function ChartReadout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx('num flex h-6 items-center gap-1.5 truncate text-xs text-muted', className)}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

/** Shared hint so the interaction is discoverable rather than hidden. */
export function ChartHint({ pinned, subject = 'point' }: { pinned: boolean; subject?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-subtle">
      <Icon name={pinned ? 'pin' : 'cursor'} size={11} />
      {pinned ? `Click to unpin` : `Hover or click a ${subject}`}
    </span>
  );
}
