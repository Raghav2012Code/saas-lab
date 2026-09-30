import { useMemo, useState, type KeyboardEvent } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import {
  ChartHint,
  ChartReadout,
  ChartTooltip,
  DEFAULT_PADDING,
  labelStride,
  niceDomain,
  tooltipPlacement,
  toUserX,
} from './core';

export interface WaterfallItem {
  label: string;
  value: number;
  kind: 'start' | 'delta' | 'total';
}

interface WaterfallChartProps {
  items: WaterfallItem[];
  ariaLabel: string;
  height?: number;
  yFormat: (value: number) => string;
  valueFormat: (value: number) => string;
}

/**
 * MRR bridge: opening MRR, the new/expansion/churned movements, closing MRR.
 * Hovering a bar names the movement, its size and the running total, which is
 * the whole reason a bridge exists.
 */
export function WaterfallChart({
  items,
  ariaLabel,
  height = 226,
  yFormat,
  valueFormat,
}: WaterfallChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const chartWidth = Math.max(width, 260);
  const active = hovered ?? pinned;
  const showingPin = pinned !== null && hovered === null;

  const geometry = useMemo(() => {
    const bars: { from: number; to: number }[] = [];
    let running = 0;

    for (const item of items) {
      if (item.kind === 'delta') {
        const from = running;
        running += item.value;
        bars.push({ from, to: running });
      } else {
        running = item.kind === 'start' ? item.value : running;
        bars.push({ from: 0, to: running });
      }
    }

    const values = bars.flatMap((bar) => [bar.from, bar.to, 0]);
    const { domain, ticks } = niceDomain(Math.min(...values, 0), Math.max(...values, 1), 4);
    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = { ...DEFAULT_PADDING, left: Math.min(78, Math.max(38, longest * 6.4 + 12)) };

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const band = items.length === 0 ? innerWidth : innerWidth / items.length;

    return {
      bars,
      padding,
      innerWidth,
      innerHeight,
      ticks,
      band,
      y: (value: number) =>
        padding.top + innerHeight - ((value - domain[0]) / (domain[1] - domain[0])) * innerHeight,
      xCenter: (index: number) => padding.left + band * index + band / 2,
    };
  }, [chartWidth, height, items, yFormat]);

  const { bars, padding, y, ticks, band, xCenter, innerHeight } = geometry;
  const readIndex = active ?? items.length - 1;
  const activeItem = items[readIndex];
  const activeBar = bars[readIndex];
  const showValueLabels = band >= 52;

  const colorFor = (index: number): string => {
    const item = items[index];
    if (!item || item.kind !== 'delta') return 'var(--series-1)';
    return item.value >= 0 ? 'var(--success)' : 'var(--danger)';
  };

  const report = (index: number | null) => setHovered(index);

  const indexAt = (clientX: number, target: Element): number | null => {
    if (items.length === 0) return null;
    const rect = target.getBoundingClientRect();
    const pixel = toUserX(clientX, rect, chartWidth) - padding.left;
    return Math.min(items.length - 1, Math.max(0, Math.floor(pixel / band)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const current = active ?? items.length - 1;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      report(Math.min(items.length - 1, current + 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      report(Math.max(0, current - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setPinned(pinned === current ? null : current);
    } else if (event.key === 'Escape') {
      setPinned(null);
      report(null);
    }
  };

  const placement =
    active !== null ? tooltipPlacement(xCenter(active), padding.top + 4, chartWidth, height, 208, 84) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-end">
        <ChartHint pinned={showingPin} subject="bar" />
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
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--grid)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={padding.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="num fill-subtle text-[11px]"
              >
                {yFormat(tick)}
              </text>
            </g>
          ))}

          {active !== null ? (
            <rect x={padding.left + band * active} y={padding.top} width={band} height={innerHeight} fill="var(--surface-2)" opacity={0.85} />
          ) : null}

          {bars.map((bar, index) => {
            const top = Math.min(y(bar.from), y(bar.to));
            const barHeight = Math.max(1.5, Math.abs(y(bar.to) - y(bar.from)));
            const item = items[index];
            const nextItem = items[index + 1];
            const nextBar = bars[index + 1];
            return (
              <g key={`${item?.label ?? index}-${index}`}>
                {nextItem && nextBar && item?.kind === 'delta' ? (
                  <line
                    x1={xCenter(index) + band * 0.3}
                    x2={xCenter(index + 1) - band * 0.3}
                    y1={y(bar.to)}
                    y2={y(bar.to)}
                    stroke="var(--border-strong)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                ) : null}
                <rect
                  x={xCenter(index) - band * 0.3}
                  y={top}
                  width={band * 0.6}
                  height={barHeight}
                  rx={2}
                  fill={colorFor(index)}
                  opacity={active === null || active === index ? 1 : 0.32}
                />
              </g>
            );
          })}

          {items.map((item, index) => {
            const bar = bars[index];
            if (!bar) return null;
            const emphasised = active === index;
            if (!showValueLabels && !emphasised) return null;
            const labelY =
              item.kind === 'delta' && item.value < 0
                ? Math.min(y(bar.to) + 13, height - padding.bottom)
                : Math.max(y(bar.to) - 6, padding.top + 9);
            return (
              <text
                key={`value-${item.label}-${index}`}
                x={xCenter(index)}
                y={labelY}
                textAnchor="middle"
                className={emphasised ? 'num fill-fg-strong text-[11px] font-semibold' : 'num fill-fg text-[11px] font-medium'}
              >
                {item.kind === 'delta'
                  ? `${item.value >= 0 ? '+' : ''}${valueFormat(item.value)}`
                  : valueFormat(item.value)}
              </text>
            );
          })}

          {items.map((item, index) =>
            labelStride(items.length, geometry.innerWidth, 34) === 1 ||
            index % labelStride(items.length, geometry.innerWidth, 34) === 0 ||
            index === items.length - 1 ? (
              <text
                key={`label-${item.label}-${index}`}
                x={xCenter(index)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className={active === index ? 'fill-fg text-[11px] font-medium' : 'fill-subtle text-[11px]'}
              >
                {item.label}
              </text>
            ) : null,
          )}
        </svg>

        {placement ? (
          <ChartTooltip
            left={placement.left}
            top={placement.top}
            title={activeItem ? activeItem.label : ''}
            subtitle={
              activeBar
                ? `${activeItem?.kind === 'delta' ? 'movement' : activeItem?.kind === 'start' ? 'opening MRR' : 'closing MRR'} · running ${valueFormat(activeBar.to)}`
                : undefined
            }
            items={
              activeItem
                ? [
                    {
                      id: 'value',
                      label: activeItem.kind === 'delta' ? 'Change' : 'MRR',
                      value: `${activeItem.kind === 'delta' && activeItem.value >= 0 ? '+' : ''}${valueFormat(activeItem.value)}`,
                      color: colorFor(readIndex),
                    },
                  ]
                : []
            }
            pinned={showingPin}
          />
        ) : null}
      </div>

      <ChartReadout>
        {active === null ? (
          <span className="text-subtle">Showing {activeItem?.label}</span>
        ) : (
          <span className="text-accent-fg">{showingPin ? 'Pinned' : 'Inspecting'}</span>
        )}
        <span className="text-fg">{activeItem?.label}</span>
        {' · '}
        <span className="text-fg">
          {activeItem
            ? (activeItem.kind === 'delta' && activeItem.value >= 0 ? '+' : '') + valueFormat(activeItem.value)
            : ''}
        </span>
        {activeBar ? (
          <>
            {' · running '}
            <span className="text-fg">{valueFormat(activeBar.to)}</span>
          </>
        ) : null}
      </ChartReadout>
    </div>
  );
}
