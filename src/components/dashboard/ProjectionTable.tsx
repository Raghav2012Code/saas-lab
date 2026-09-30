import type { MonthPoint } from '../../engine/types';
import { monthLabels } from '../../lib/labels';
import { useModel } from '../../state/store';

/** Every month of the projection, in raw numbers, scrollable and sticky. */
export function ProjectionTable({ points }: { points: MonthPoint[] }) {
  const { fmt } = useModel();
  const labels = monthLabels(points);

  return (
    <div className="scroll-area max-h-[26rem] overflow-auto">
      <table className="data-table min-w-[58rem]">
        <caption className="sr-only">
          Month-by-month projection of customers, revenue, costs and cash
        </caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Customers</th>
            <th scope="col">New</th>
            <th scope="col">Churned</th>
            <th scope="col">MRR</th>
            <th scope="col">New MRR</th>
            <th scope="col">Expansion</th>
            <th scope="col">Churned MRR</th>
            <th scope="col">Gross profit</th>
            <th scope="col">S&amp;M</th>
            <th scope="col">Opex</th>
            <th scope="col">Net cash flow</th>
            <th scope="col">Cash</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={point.month}>
              <th scope="row">
                {index === 0 ? 'Today' : `Month ${point.month}`}
                <span className="pl-1.5 text-xs text-subtle">{labels[index]}</span>
              </th>
              <td className="num">{fmt.number(point.customers)}</td>
              <td className="num">{fmt.number(point.newCustomers, 1)}</td>
              <td className="num">{fmt.number(point.churnedCustomers, 1)}</td>
              <td className="num">{fmt.money(point.mrr)}</td>
              <td className="num">{fmt.money(point.newMrr)}</td>
              <td className="num">{fmt.money(point.expansionMrr)}</td>
              <td className="num text-danger">-{fmt.money(point.churnedMrr)}</td>
              <td className="num">{fmt.money(point.grossProfit)}</td>
              <td className="num text-muted">-{fmt.money(point.smSpend)}</td>
              <td className="num text-muted">-{fmt.money(point.opex)}</td>
              <td className={`num ${point.netCashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                {point.netCashFlow >= 0 ? '+' : '-'}
                {fmt.money(Math.abs(point.netCashFlow))}
              </td>
              <td className="num text-fg-strong">{fmt.money(point.cash)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
