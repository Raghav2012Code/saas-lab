import { useMemo, useState, type PointerEvent } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import {
  Axes,
  ChartLegend,
  ChartReadout,
  ChartTooltip,
  DEFAULT_PADDING,
  labelStride,
  niceDomain,
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
  /** colour bars by the sign of their value (used for cash flow) */
  signColors?: { positive: string; negative: string };
  summaryPrefix?: string;
}

/** Grouped bars that grow from zero in both directions. */
export function BarChart({
  series,
  labels,
  ariaLabel,
  height = 200,
  yFormat,
  valueFormat,
  signColors,
  summaryPrefix,
}: BarChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const chartWidth = Math.max(width, 260);
  const count = labels.length;

  const geometry = useMemo(() => {
    const [dataMin, dataMax] = valueExtent(
      series.map((item) => item.values),
      true,
    );
    const { domain, ticks } = niceDomain(dataMin, dataMax, 4);
    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = { ...DEFAULT_PADDING, left: Math.min(78, Math.max(38, longest * 6.3 + 12)) };

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const band = count === 0 ? innerWidth : innerWidth / count;
    const groupWidth = band * 0.66;
    const barWidth = Math.max(2, groupWidth / Math.max(1, series.length));

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
  }, [chartWidth, count, height, series, yFormat]);

  const { padding, y, ticks, band, barWidth, zeroY, xCenter } = geometry;

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pixel = event.clientX - rect.left - padding.left;
    const index = Math.floor(pixel / band);
    setActive(Math.min(count - 1, Math.max(0, index)));
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
      <ChartLegend
        items={
          signColors
            ? [
                { id: 'positive', label: 'Positive', color: signColors.positive },
                { id: 'negative', label: 'Negative', color: signColors.negative },
              ]
            : series
        }
      />

      <div ref={container} className="relative">
        <svg
          width={chartWidth}
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block max-w-full touch-none focus-visible:outline-2 focus-visible:outline-offset-2"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={(event) => {
            if (count === 0) return;
            const current = active ?? count - 1;
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              setActive(Math.min(count - 1, current + 1));
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setActive(Math.max(0, current - 1));
            } else if (event.key === 'Escape') {
              setActive(null);
            }
          }}
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
              opacity={0.7}
            />
          ) : null}

          {labels.map((label, index) =>
            series.map((item, seriesIndex) => {
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
              return (
                <rect
                  key={`${label}-${item.id}-${index}`}
                  x={xCenter(index) - (barWidth * series.length) / 2 + seriesIndex * barWidth + 0.5}
                  y={top}
                  width={Math.max(2, barWidth - 1)}
                  height={barHeight}
                  rx={2}
                  fill={color}
                  opacity={active === null || active === index ? 1 : 0.45}
                />
              );
            }),
          )}
        </svg>

        {active !== null && chartWidth >= 520 ? (
          <ChartTooltip
            x={xCenter(active)}
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
