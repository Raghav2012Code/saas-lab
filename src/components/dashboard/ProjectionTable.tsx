import { useState } from 'react';

import type { MonthPoint } from '../../engine/types';
import { monthLabels } from '../../lib/labels';
import { cx } from '../../lib/cx';
import { useModel } from '../../state/store';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';

interface Column {
  key: string;
  label: string;
  explain: string;
  /** how to render the value; defaults to a signed number */
  value: (point: MonthPoint, fmt: ReturnType<typeof useModel>['fmt']) => string;
  tone?: (point: MonthPoint) => 'default' | 'muted' | 'good' | 'bad';
  negative?: (point: MonthPoint) => boolean;
}

const COLUMNS: Column[] = [
  {
    key: 'customers',
    label: 'Customers',
    explain: 'Paying customers at the end of the month: last month’s customers, less churn, plus new.',
    value: (p, fmt) => fmt.number(p.customers),
  },
  {
    key: 'newCustomers',
    label: 'New',
    explain: 'Customers acquired during the month.',
    value: (p, fmt) => fmt.number(p.newCustomers, 1),
  },
  {
    key: 'churnedCustomers',
    label: 'Churned',
    explain: 'Customers who cancelled during the month.',
    value: (p, fmt) => `-${fmt.number(p.churnedCustomers, 1)}`,
    tone: () => 'bad',
  },
  {
    key: 'mrr',
    label: 'MRR',
    explain: 'Monthly recurring revenue: customers × revenue per customer.',
    value: (p, fmt) => fmt.money(p.mrr),
  },
  {
    key: 'newMrr',
    label: 'New MRR',
    explain: 'Revenue added by this month’s new customers, valued at this month’s ARPU.',
    value: (p, fmt) => fmt.money(p.newMrr),
  },
  {
    key: 'expansionMrr',
    label: 'Expansion',
    explain: 'Extra revenue from existing customers upgrading, as ARPU grows month on month.',
    value: (p, fmt) => fmt.money(p.expansionMrr),
  },
  {
    key: 'churnedMrr',
    label: 'Churned MRR',
    explain: 'Revenue lost to cancellations, valued at this month’s ARPU.',
    value: (p, fmt) => `-${fmt.money(p.churnedMrr)}`,
    tone: () => 'bad',
  },
  {
    key: 'netNewMrr',
    label: 'Net new',
    explain: 'New plus expansion, less churned. By construction this equals the change in MRR.',
    value: (p, fmt) =>
      p.netNewMrr >= 0 ? `+${fmt.money(p.netNewMrr)}` : `-${fmt.money(Math.abs(p.netNewMrr))}`,
    tone: (p) => (p.netNewMrr >= 0 ? 'good' : 'bad'),
  },
  {
    key: 'grossProfit',
    label: 'Gross profit',
    explain: 'Revenue × gross margin. What is left to fund acquisition and operations.',
    value: (p, fmt) => fmt.money(p.grossProfit),
  },
  {
    key: 'smSpend',
    label: 'S&M',
    explain: 'Sales & marketing. CAC × new customers, so spend follows acquisition volume.',
    value: (p, fmt) => `-${fmt.money(p.smSpend)}`,
    tone: () => 'muted',
  },
  {
    key: 'opex',
    label: 'Opex',
    explain: 'R&D and G&A. Excludes cost of revenue and sales & marketing so nothing is double counted.',
    value: (p, fmt) => `-${fmt.money(p.opex)}`,
    tone: () => 'muted',
  },
  {
    key: 'netCashFlow',
    label: 'Net cash flow',
    explain: 'Gross profit less sales & marketing and operating expenses.',
    value: (p, fmt) =>
      p.netCashFlow >= 0
        ? `+${fmt.money(p.netCashFlow)}`
        : `-${fmt.money(Math.abs(p.netCashFlow))}`,
    tone: (p) => (p.netCashFlow >= 0 ? 'good' : 'bad'),
  },
  {
    key: 'cash',
    label: 'Cash',
    explain: 'Starting cash plus every month’s net cash flow up to this point.',
    value: (p, fmt) => fmt.money(p.cash),
    tone: (p) => (p.cash < 0 ? 'bad' : 'default'),
  },
];

interface ProjectionTableProps {
  points: MonthPoint[];
  /** month the cash balance first goes negative, if it does */
  cashOutMonth?: number | null;
  /** month net cash flow first turns positive, if it does */
  breakEvenMonth?: number | null;
  /** the row highlighted because a chart is being inspected */
  linkedIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
}

/**
 * Every month of the projection in raw numbers.
 *
 * Three things make a 25-row table usable rather than a wall: the column you are
 * in is traced across the whole table, the row you are on drives the charts
 * above, and every column explains itself on hover or focus.
 */
export function ProjectionTable({
  points,
  cashOutMonth = null,
  breakEvenMonth = null,
  linkedIndex = null,
  onHoverIndex,
}: ProjectionTableProps) {
  const { fmt } = useModel();
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const labels = monthLabels(points);

  return (
    <div className="scroll-area max-h-[26rem] overflow-auto" onPointerLeave={() => onHoverIndex?.(null)}>
      <table className="data-table min-w-[62rem]">
        <caption className="sr-only">
          Month-by-month projection of customers, revenue, costs and cash
        </caption>
        <thead>
          <tr>
            <th scope="col">
              Period
            </th>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx('num', hoveredColumn === column.key && 'col-active')}
                onPointerEnter={() => setHoveredColumn(column.key)}
                onPointerLeave={() => setHoveredColumn(null)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.label}
                  <InfoTip label={column.label}>{column.explain}</InfoTip>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => {
            const isCashOut = cashOutMonth !== null && Math.round(cashOutMonth) === point.month;
            const isBreakEven = breakEvenMonth !== null && breakEvenMonth === point.month;
            return (
              <tr
                key={point.month}
                className={cx((linkedIndex === index || hoveredRow === index) && 'row-active')}
                onPointerEnter={() => {
                  setHoveredRow(index);
                  onHoverIndex?.(index);
                }}
                onPointerLeave={() => setHoveredRow(null)}
              >
                <th scope="row">
                  <span className="flex items-center gap-1.5">
                    <span className="text-fg">
                      {index === 0 ? 'Today' : `Month ${point.month}`}
                      <span className="pl-1.5 text-xs text-subtle">{labels[index]}</span>
                    </span>
                    {isCashOut ? (
                      <span
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-danger"
                        title="Cash balance turns negative this month"
                      >
                        <Icon name="warning" size={10} />
                        cash out
                      </span>
                    ) : null}
                    {isBreakEven ? (
                      <span
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-success"
                        title="Net cash flow turns positive this month"
                      >
                        <Icon name="check" size={10} />
                        break-even
                      </span>
                    ) : null}
                  </span>
                </th>
                {COLUMNS.map((column) => {
                  const tone = column.tone?.(point) ?? 'default';
                  return (
                    <td
                      key={column.key}
                      className={cx(
                        'num',
                        hoveredColumn === column.key && 'col-active',
                        tone === 'muted' && 'text-muted',
                        tone === 'good' && 'text-success',
                        tone === 'bad' && 'text-danger',
                        column.key === 'cash' && tone === 'default' && 'text-fg-strong',
                      )}
                    >
                      {column.value(point, fmt)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
