import { useMemo, useState, type KeyboardEvent } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import {
  Axes,
  ChartHint,
  ChartLegend,
  ChartReadout,
  ChartTooltip,
  DEFAULT_PADDING,
  labelStride,
  niceDomain,
  tooltipPlacement,
  toUserX,
  valueExtent,
} from './core';

export interface BarSeries {
  id: string;
  label: string;
  color: string;
  values: (number | null)[];
}

interface BarChartProps {
  series: BarSeries[];
  labels: string[];
  ariaLabel: string;
  height?: number;
  yFormat: (value: number) => string;
  valueFormat: (value: number) => string;
  changeFormat?: (value: number) => string;
  /** colour bars by the sign of their value (used for cash flow) */
  signColors?: { positive: string; negative: string };
  hiddenSeries?: string[];
  onToggleSeries?: (id: string) => void;
  externalIndex?: number | null;
  onIndexChange?: (index: number | null) => void;
}

/**
 * Grouped bars that grow from zero in both directions. The hovered month gets a
 * band plus full-strength bars; every other month dims, so the column you are
 * on is unmistakable at a glance.
 */
export function BarChart({
  series,
  labels,
  ariaLabel,
  height = 200,
  yFormat,
  valueFormat,
  changeFormat,
  signColors,
  hiddenSeries = [],
  onToggleSeries,
  externalIndex = null,
  onIndexChange,
}: BarChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const chartWidth = Math.max(width, 260);
  const count = labels.length;
  const active = externalIndex ?? hovered ?? pinned;
  const showingPin = pinned !== null && hovered === null && externalIndex === null;

  const visible = series.filter((item) => !hiddenSeries.includes(item.id));
  const drawable = visible.length > 0 ? visible : series;

  const geometry = useMemo(() => {
    const [dataMin, dataMax] = valueExtent(
      drawable.map((item) => item.values),
      true,
    );
    const { domain, ticks } = niceDomain(dataMin, dataMax, 4);
    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = { ...DEFAULT_PADDING, left: Math.min(78, Math.max(38, longest * 6.4 + 12)) };

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const band = count === 0 ? innerWidth : innerWidth / count;
    const groupWidth = band * 0.66;
    const barWidth = Math.max(2, groupWidth / Math.max(1, drawable.length));

    return {
      padding,
      innerWidth,
      innerHeight,
      ticks,
      band,
      barWidth,
      zeroY: padding.top + innerHeight - ((0 - domain[0]) / (domain[1] - domain[0])) * innerHeight,
      y: (value: number) =>
        padding.top + innerHeight - ((value - domain[0]) / (domain[1] - domain[0])) * innerHeight,
      xCenter: (index: number) => padding.left + band * index + band / 2,
    };
  }, [chartWidth, count, drawable, height, yFormat]);

  const { padding, y, ticks, band, barWidth, zeroY, xCenter } = geometry;

  const report = (index: number | null) => {
    setHovered(index);
    onIndexChange?.(index);
  };

  const indexAt = (clientX: number, target: Element): number | null => {
    if (count === 0) return null;
    const rect = target.getBoundingClientRect();
    const pixel = toUserX(clientX, rect, chartWidth) - padding.left;
    return Math.min(count - 1, Math.max(0, Math.floor(pixel / band)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (count === 0) return;
    const current = active ?? count - 1;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      report(Math.min(count - 1, current + 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      report(Math.max(0, current - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = active ?? count - 1;
      setPinned(pinned === target ? null : target);
    } else if (event.key === 'Escape') {
      setPinned(null);
      report(null);
    }
  };

  const readIndex = active ?? count - 1;
  const items = (active === null ? series : drawable).map((item) => {
    const value = item.values[readIndex];
    const previous = readIndex > 0 ? item.values[readIndex - 1] : null;
    let change: string | null = null;
    if (changeFormat && value !== null && value !== undefined && previous !== null && previous !== undefined) {
      const delta = value - previous;
      if (Math.abs(delta) > 1e-9) change = `${delta > 0 ? '+' : '-'}${changeFormat(Math.abs(delta))}`;
    }
    return {
      id: item.id,
      label: item.label,
      value: value === null || value === undefined ? '\u2014' : valueFormat(value),
      color: signColors && series.length === 1 ? (value !== null && value !== undefined && value >= 0 ? signColors.positive : signColors.negative) : item.color,
      change,
      lowerIsBetter: false,
    };
  });

  const placement =
    active !== null ? tooltipPlacement(xCenter(active), padding.top + 4, chartWidth, height, 208, 88) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <ChartLegend
          items={
            signColors && series.length === 1
              ? [
                  { id: 'positive', label: 'Positive (+)', color: signColors.positive },
                  { id: 'negative', label: 'Negative (−)', color: signColors.negative },
                ]
              : series
          }
          onToggle={signColors && series.length === 1 ? undefined : onToggleSeries}
          hidden={signColors && series.length === 1 ? [] : hiddenSeries}
        />
        <ChartHint pinned={showingPin} />
      </div>

      <div ref={container} className="relative">
        <svg
          width={chartWidth}
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block max-w-full cursor-crosshair touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-2"
          onPointerMove={(event) => report(indexAt(event.clientX, event.currentTarget))}
          onPointerLeave={() => report(null)}
          onClick={(event) => {
            const index = indexAt(event.clientX, event.currentTarget);
            setPinned(pinned === index ? null : index);
          }}
          onKeyDown={onKeyDown}
          style={{ outlineColor: 'var(--ring)' }}
        >
          <Axes
            width={chartWidth}
            height={height}
            padding={padding}
            yTicks={ticks}
            y={y}
            yFormat={yFormat}
            labels={labels}
            x={xCenter}
            stride={labelStride(count, geometry.innerWidth)}
            emphasis={0}
          />

          {active !== null ? (
            <rect
              x={padding.left + band * active}
              y={padding.top}
              width={band}
              height={geometry.innerHeight}
              fill="var(--surface-2)"
              opacity={0.85}
            />
          ) : null}

          {labels.map((label, index) =>
            drawable.map((item, seriesIndex) => {
              const value = item.values[index];
              if (value === null || value === undefined || !Number.isFinite(value)) return null;
              const top = Math.min(y(value), zeroY);
              const barHeight = Math.max(1, Math.abs(zeroY - y(value)));
              const color =
                signColors && series.length === 1
                  ? value >= 0
                    ? signColors.positive
                    : signColors.negative
                  : item.color;
              const emphasised = active === null || active === index;
              return (
                <rect
                  key={`${label}-${item.id}-${index}`}
                  x={xCenter(index) - (barWidth * drawable.length) / 2 + seriesIndex * barWidth + 0.5}
                  y={top}
                  width={Math.max(2, barWidth - 1)}
                  height={barHeight}
                  rx={2}
                  fill={color}
                  opacity={emphasised ? 1 : 0.28}
                />
              );
            }),
          )}

          {active !== null ? (
            <line
              x1={xCenter(active)}
              x2={xCenter(active)}
              y1={padding.top}
              y2={padding.top + geometry.innerHeight}
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
          ) : null}
        </svg>

        {placement ? (
          <ChartTooltip
            left={placement.left}
            top={placement.top}
            title={labels[readIndex] ?? ''}
            subtitle={readIndex === 0 ? 'today' : `month ${readIndex} of ${count}`}
            items={items}
            pinned={showingPin}
          />
        ) : null}
      </div>

      <ChartReadout>
        {active === null ? (
          <span className="text-subtle">Showing {labels[readIndex]}</span>
        ) : (
          <span className="text-accent-fg">{showingPin ? 'Pinned' : 'Inspecting'}</span>
        )}
        <span className="text-fg">{labels[readIndex]}</span>
        {items.map((item) => (
          <span key={item.id}>
            {' · '}
            {items.length > 1 ? `${item.label} ` : ''}
            <span className="text-fg">{item.value}</span>
            {item.change ? <span className="text-subtle"> {item.change}</span> : null}
          </span>
        ))}
      </ChartReadout>
    </div>
  );
}
