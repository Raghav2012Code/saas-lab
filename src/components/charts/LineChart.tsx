import { useMemo, useState, type KeyboardEvent } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import {
  Axes,
  ChartHint,
  ChartLegend,
  ChartReadout,
  ChartTooltip,
  DEFAULT_PADDING,
  HoverBand,
  areaPath,
  labelStride,
  linePath,
  nearestIndex,
  niceDomain,
  tooltipPlacement,
  toUserX,
  valueExtent,
} from './core';

export interface LineSeries {
  id: string;
  label: string;
  color: string;
  values: (number | null)[];
  /** fill under the line */
  area?: boolean;
  dashed?: boolean;
}

interface LineChartProps {
  series: LineSeries[];
  labels: string[];
  ariaLabel: string;
  height?: number;
  includeZero?: boolean;
  /** axis labels, e.g. compact currency */
  yFormat: (value: number) => string;
  /** exact values in the tooltip */
  valueFormat: (value: number) => string;
  /** formats the movement since the previous period */
  changeFormat?: (value: number) => string;
  /** vertical marker for an event such as break-even */
  marker?: { index: number; label: string } | null;
  /** series hidden by the user, toggled from the legend */
  hiddenSeries?: string[];
  onToggleSeries?: (id: string) => void;
  /** index highlighted from outside (e.g. hovering a table row) */
  externalIndex?: number | null;
  /** reports the hovered index back, so a table can follow along */
  onIndexChange?: (index: number | null) => void;
}

/**
 * Multi-series line/area chart.
 *
 * Interaction is the point of this component, not decoration: a hovered band
 * marks the column, the card carries the period, every series value and the
 * movement since the previous period, a click pins the readout so it can be
 * read (and survives on touch), and the whole thing is operable by keyboard.
 * The card is shown at every width — it repositions rather than disappearing.
 */
export function LineChart({
  series,
  labels,
  ariaLabel,
  height = 220,
  includeZero = true,
  yFormat,
  valueFormat,
  changeFormat,
  marker,
  hiddenSeries = [],
  onToggleSeries,
  externalIndex = null,
  onIndexChange,
}: LineChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const chartWidth = width > 0 ? width : 320;
  const count = labels.length;
  // Hovering always wins, so a pinned point never blocks exploring; the pin
  // reappears as soon as the pointer leaves.
  const active = externalIndex ?? hovered ?? pinned;
  const showingPin = pinned !== null && hovered === null && externalIndex === null;

  const visible = useMemo(
    () => series.filter((item) => !hiddenSeries.includes(item.id)),
    [series, hiddenSeries],
  );
  const drawable = visible.length > 0 ? visible : series;

  const geometry = useMemo(() => {
    const [dataMin, dataMax] = valueExtent(drawable.map((item) => item.values), includeZero);
    const { domain, ticks } = niceDomain(dataMin, dataMax, 4);

    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = {
      ...DEFAULT_PADDING,
      left: Math.min(78, Math.max(38, longest * 6.4 + 12)),
    };

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const step = count <= 1 ? 0 : innerWidth / (count - 1);

    return {
      padding,
      innerWidth,
      innerHeight,
      ticks,
      step,
      x: (index: number) => padding.left + (count <= 1 ? innerWidth / 2 : index * step),
      y: (value: number) =>
        padding.top + innerHeight - ((value - domain[0]) / (domain[1] - domain[0])) * innerHeight,
      zeroY: padding.top + innerHeight - ((0 - domain[0]) / (domain[1] - domain[0])) * innerHeight,
    };
  }, [chartWidth, count, drawable, height, includeZero, yFormat]);

  const { padding, x, y, ticks, innerHeight, step } = geometry;

  const report = (index: number | null) => {
    setHovered(index);
    onIndexChange?.(index);
  };

  const indexAt = (clientX: number, target: Element): number | null => {
    if (count === 0) return null;
    const rect = target.getBoundingClientRect();
    return nearestIndex(x, count, toUserX(clientX, rect, chartWidth));
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
    } else if (event.key === 'Home') {
      event.preventDefault();
      report(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      report(count - 1);
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
      color: item.color,
      change,
    };
  });

  const placement =
    active !== null
      ? tooltipPlacement(x(active), padding.top + 6, chartWidth, height, 208, 92)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <ChartLegend items={series} onToggle={onToggleSeries} hidden={hiddenSeries} />
        <ChartHint pinned={showingPin} />
      </div>

      <div ref={container} className="relative min-w-0">
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
          {active !== null ? (
            <HoverBand x={x(active)} width={step} top={padding.top} height={innerHeight} />
          ) : null}

          <Axes
            width={chartWidth}
            height={height}
            padding={padding}
            yTicks={ticks}
            y={y}
            yFormat={yFormat}
            labels={labels}
            x={x}
            stride={labelStride(count, geometry.innerWidth)}
            emphasis={includeZero ? 0 : null}
          />

          {visible.map((item, seriesIndex) => {
            const points = item.values.flatMap((value, index) =>
              value === null || !Number.isFinite(value) ? [] : [[x(index), y(value)] as [number, number]],
            );
            if (points.length === 0) return null;
            return (
              <g key={item.id}>
                {item.area ? (
                  <path d={areaPath(points, geometry.zeroY)} fill={item.color} opacity={0.1} />
                ) : null}
                <path
                  className={seriesIndex > 0 ? `chart-line-${seriesIndex + 1}` : undefined}
                  d={linePath(points)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={item.dashed ? '4 3' : undefined}
                />
              </g>
            );
          })}

          {marker && marker.index >= 0 && marker.index < count ? (
            <g>
              <line
                x1={x(marker.index)}
                x2={x(marker.index)}
                y1={padding.top}
                y2={padding.top + innerHeight}
                stroke="var(--accent)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={x(marker.index)}
                y={padding.top + 9}
                textAnchor="middle"
                className="fill-accent text-[11px] font-medium"
              >
                {marker.label}
              </text>
            </g>
          ) : null}

          {active !== null ? (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={padding.top}
                y2={padding.top + innerHeight}
                stroke="var(--border-strong)"
                strokeWidth={1}
              />
              {drawable.map((item) => {
                const value = item.values[active];
                if (value === null || value === undefined) return null;
                return (
                  <g key={item.id}>
                    <circle cx={x(active)} cy={y(value)} r={5.5} fill={item.color} opacity={0.18} />
                    <circle
                      cx={x(active)}
                      cy={y(value)}
                      r={3.5}
                      fill="var(--surface)"
                      stroke={item.color}
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </g>
          ) : (
            drawable.map((item) => {
              const value = item.values[count - 1];
              if (value === null || value === undefined) return null;
              return <circle key={item.id} cx={x(count - 1)} cy={y(value)} r={2.6} fill={item.color} />;
            })
          )}
        </svg>

        {placement ? (
          <ChartTooltip
            left={placement.left}
            top={placement.top}
            title={labels[readIndex] ?? ''}
            subtitle={readIndex === 0 ? 'today' : `month ${readIndex} of ${count - 1}`}
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
