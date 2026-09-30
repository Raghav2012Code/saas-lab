import { round } from './math';
import type { Model, MonthPoint } from './types';

export interface CsvColumn {
  key: string;
  label: string;
}

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns: CsvColumn[], rows: Record<string, string | number>[]): string {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column.key] ?? '')).join(','));
  return [header, ...body].join('\r\n');
}

const PROJECTION_COLUMNS: CsvColumn[] = [
  { key: 'month', label: 'Month' },
  { key: 'date', label: 'Period start' },
  { key: 'customers', label: 'Customers' },
  { key: 'newCustomers', label: 'New customers' },
  { key: 'churnedCustomers', label: 'Churned customers' },
  { key: 'arpu', label: 'ARPU' },
  { key: 'mrr', label: 'MRR' },
  { key: 'arr', label: 'ARR' },
  { key: 'newMrr', label: 'New MRR' },
  { key: 'expansionMrr', label: 'Expansion MRR' },
  { key: 'churnedMrr', label: 'Churned MRR' },
  { key: 'netNewMrr', label: 'Net new MRR' },
  { key: 'mrrGrowthPct', label: 'MRR growth %' },
  { key: 'netRetentionPct', label: 'Net revenue retention %' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'cogs', label: 'Cost of revenue' },
  { key: 'grossProfit', label: 'Gross profit' },
  { key: 'smSpend', label: 'Sales & marketing' },
  { key: 'opex', label: 'Operating expenses' },
  { key: 'netCashFlow', label: 'Net cash flow' },
  { key: 'cash', label: 'Cash balance' },
];

/** Raw numbers, no currency symbols: ready for a spreadsheet. */
export function projectionCsv(points: MonthPoint[]): string {
  const rows = points.map((point) => ({
    month: point.month,
    date: point.date,
    customers: round(point.customers, 2),
    newCustomers: round(point.newCustomers, 2),
    churnedCustomers: round(point.churnedCustomers, 2),
    arpu: round(point.arpu, 2),
    mrr: round(point.mrr, 2),
    arr: round(point.arr, 2),
    newMrr: round(point.newMrr, 2),
    expansionMrr: round(point.expansionMrr, 2),
    churnedMrr: round(point.churnedMrr, 2),
    netNewMrr: round(point.netNewMrr, 2),
    mrrGrowthPct: point.mrrGrowth === null ? '' : round(point.mrrGrowth * 100, 2),
    netRetentionPct: point.netRetention === null ? '' : round(point.netRetention * 100, 2),
    revenue: round(point.revenue, 2),
    cogs: round(point.cogs, 2),
    grossProfit: round(point.grossProfit, 2),
    smSpend: round(point.smSpend, 2),
    opex: round(point.opex, 2),
    netCashFlow: round(point.netCashFlow, 2),
    cash: round(point.cash, 2),
  }));

  return toCsv(PROJECTION_COLUMNS, rows);
}

const ASSUMPTION_COLUMNS: CsvColumn[] = [
  { key: 'assumption', label: 'Assumption' },
  { key: 'value', label: 'Value' },
];

export function assumptionsCsv(model: Model, specRows: { label: string; value: string }[]): string {
  return toCsv(
    ASSUMPTION_COLUMNS,
    specRows.map((row) => ({ assumption: row.label, value: row.value })),
  );
}

export interface ModelExport {
  version: number;
  exportedAt: string;
  currency: string;
  model: Model;
  summary: Record<string, string | number | null>;
}

export function modelJson(payload: ModelExport): string {
  return JSON.stringify(payload, null, 2);
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Clipboard with a fallback for browsers that block the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
