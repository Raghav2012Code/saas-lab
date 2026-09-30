import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import {
  Axes,
  ChartLegend,
  ChartReadout,
  ChartTooltip,
  DEFAULT_PADDING,
  areaPath,
  labelStride,
  linePath,
  nearestIndex,
  niceDomain,
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
  /** vertical marker for an event such as break-even */
  marker?: { index: number; label: string } | null;
  /** short text describing the final point, shown when nothing is hovered */
  summaryPrefix?: string;
}

/**
 * Multi-series line/area chart with crosshair hover, touch support and keyboard
 * inspection. Values are supplied by the caller so the chart holds no model logic.
 */
export function LineChart({
  series,
  labels,
  ariaLabel,
  height = 220,
  includeZero = true,
  yFormat,
  valueFormat,
  marker,
  summaryPrefix,
}: LineChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const chartWidth = Math.max(width, 260);
  const count = labels.length;

  const geometry = useMemo(() => {
    const [dataMin, dataMax] = valueExtent(series.map((item) => item.values), includeZero);
    const { domain, ticks } = niceDomain(dataMin, dataMax, 4);

    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = {
      ...DEFAULT_PADDING,
      left: Math.min(78, Math.max(38, longest * 6.3 + 12)),
    };

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const step = count <= 1 ? 0 : innerWidth / (count - 1);

    return {
      padding,
      innerWidth,
      innerHeight,
      ticks,
      x: (index: number) => padding.left + (count <= 1 ? innerWidth / 2 : index * step),
      y: (value: number) =>
        padding.top + innerHeight - ((value - domain[0]) / (domain[1] - domain[0])) * innerHeight,
      zeroY: padding.top + innerHeight - ((0 - domain[0]) / (domain[1] - domain[0])) * innerHeight,
    };
  }, [chartWidth, count, height, includeZero, series, yFormat]);

  const { padding, x, y, ticks, innerHeight } = geometry;

  const findIndex = (event: PointerEvent<SVGSVGElement>): number | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (count === 0) return null;
    return nearestIndex(
      (index) => x(index) - rect.left,
      count,
      event.clientX - rect.left,
    );
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (count === 0) return;
    const current = active ?? count - 1;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(Math.min(count - 1, current + 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(Math.max(0, current - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(count - 1);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  };

  const readIndex = active ?? count - 1;

  const tooltipItems = series.map((item) => {
    const value = item.values[readIndex];
    return {
      id: item.id,
      label: item.label,
      value: value === null || value === undefined ? '\u2014' : valueFormat(value),
      color: item.color,
    };
  });

  return (
    <div className="flex flex-col gap-2">
      <ChartLegend items={series} />

      <div ref={container} className="relative">
        <svg
          width={chartWidth}
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block max-w-full touch-none focus-visible:outline-2 focus-visible:outline-offset-2"
          onPointerMove={(event) => setActive(findIndex(event))}
          onPointerDown={(event) => setActive(findIndex(event))}
          onPointerLeave={() => setActive(null)}
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
            x={x}
            stride={labelStride(count, geometry.innerWidth)}
            emphasis={includeZero ? 0 : null}
          />

          {series.map((item) => {
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
                className="fill-accent text-[10px] font-medium"
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
              {series.map((item) => {
                const value = item.values[active];
                if (value === null || value === undefined) return null;
                return (
                  <circle
                    key={item.id}
                    cx={x(active)}
                    cy={y(value)}
                    r={3.5}
                    fill="var(--surface)"
                    stroke={item.color}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          ) : (
            series.map((item) => {
              const value = item.values[count - 1];
              if (value === null || value === undefined) return null;
              return <circle key={item.id} cx={x(count - 1)} cy={y(value)} r={2.6} fill={item.color} />;
            })
          )}
        </svg>

        {active !== null && chartWidth >= 520 ? (
          <ChartTooltip
            x={x(active)}
            y={padding.top}
            containerWidth={chartWidth}
            title={labels[active] ?? ''}
            items={tooltipItems}
          />
        ) : null}
      </div>

      <ChartReadout width={chartWidth}>
        {summaryPrefix ? `${summaryPrefix} · ` : ''}
        <span className="text-fg">{labels[readIndex]}</span>
        {tooltipItems.map((item) => (
          <span key={item.id}>
            {' · '}
            {series.length > 1 ? `${item.label} ` : ''}
            <span className="text-fg">{item.value}</span>
          </span>
        ))}
      </ChartReadout>
    </div>
  );
}
