import { useMemo, useState } from 'react';

import { useMeasure } from '../../hooks/useMeasure';
import { DEFAULT_PADDING, labelStride, niceDomain } from './core';

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
 * Exactly where each dollar came from or went.
 */
export function WaterfallChart({
  items,
  ariaLabel,
  height = 226,
  yFormat,
  valueFormat,
}: WaterfallChartProps) {
  const [container, width] = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const chartWidth = Math.max(width, 260);

  const geometry = useMemo(() => {
    const bars: { from: number; to: number; base: number }[] = [];
    let running = 0;

    for (const item of items) {
      if (item.kind === 'delta') {
        const from = running;
        running += item.value;
        bars.push({ from, to: running, base: 0 });
      } else {
        running = item.kind === 'start' ? item.value : running;
        bars.push({ from: 0, to: running, base: 0 });
      }
    }

    const values = bars.flatMap((bar) => [bar.from, bar.to, 0]);
    const { domain, ticks } = niceDomain(
      Math.min(...values, 0),
      Math.max(...values, 1),
      4,
    );
    const longest = ticks.reduce((max, tick) => Math.max(max, yFormat(tick).length), 0);
    const padding = { ...DEFAULT_PADDING, left: Math.min(78, Math.max(38, longest * 6.3 + 12)) };

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

  const { bars, padding, y, ticks, band, xCenter } = geometry;
  const readIndex = active ?? items.length - 1;
  const activeItem = items[readIndex];
  const activeBar = bars[readIndex];
  // At narrow widths the per-bar figures would collide, so the readout below
  // carries the exact numbers instead.
  const showValueLabels = band >= 52;

  const colorFor = (index: number): string => {
    const item = items[index];
    if (!item) return 'var(--series-1)';
    if (item.kind !== 'delta') return 'var(--series-1)';
    return item.value >= 0 ? 'var(--success)' : 'var(--danger)';
  };

  return (
    <div className="flex flex-col gap-2">
      <div ref={container} className="relative">
        <svg
          width={chartWidth}
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="block max-w-full focus-visible:outline-2 focus-visible:outline-offset-2"
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const index = Math.floor((event.clientX - rect.left - padding.left) / band);
            setActive(Math.min(items.length - 1, Math.max(0, index)));
          }}
          onPointerLeave={() => setActive(null)}
          onKeyDown={(event) => {
            const current = active ?? items.length - 1;
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              setActive(Math.min(items.length - 1, current + 1));
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setActive(Math.max(0, current - 1));
            } else if (event.key === 'Escape') {
              setActive(null);
            }
          }}
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
                className="num fill-subtle text-[10px]"
              >
                {yFormat(tick)}
              </text>
            </g>
          ))}

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
                  opacity={active === null || active === index ? 1 : 0.45}
                />
              </g>
            );
          })}

          {showValueLabels
            ? items.map((item, index) => {
                const bar = bars[index];
                if (!bar) return null;
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
                    className="num fill-fg text-[10px] font-medium"
                  >
                    {item.kind === 'delta'
                      ? `${item.value >= 0 ? '+' : ''}${valueFormat(item.value)}`
                      : valueFormat(item.value)}
                  </text>
                );
              })
            : null}

          {items.map((item, index) =>
            labelStride(items.length, geometry.innerWidth, 34) === 1 ||
            index % labelStride(items.length, geometry.innerWidth, 34) === 0 ||
            index === items.length - 1 ? (
              <text
                key={`label-${item.label}-${index}`}
                x={xCenter(index)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className="fill-subtle text-[10px]"
              >
                {item.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      <div className="num h-5 truncate text-xs text-muted" aria-live="polite">
        <span className="text-fg">{activeItem?.label}</span>
        {' · '}
        <span className="text-fg">
          {activeItem ? (activeItem.kind === 'delta' && activeItem.value >= 0 ? '+' : '') + valueFormat(activeItem.value) : ''}
        </span>
        {activeBar ? (
          <>
            {' · running '}
            <span className="text-fg">{valueFormat(activeBar.to)}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
