/**
 * The plain-language documentation behind the model. The methodology tab reads
 * straight from here, so the formulas shown to users are the ones implemented.
 */

export interface MetricDoc {
  id: string;
  name: string;
  formula: string;
  note?: string;
}

export const METRIC_DOCS: MetricDoc[] = [
  {
    id: 'mrr',
    name: 'MRR',
    formula: 'customers × ARPU',
    note: 'ARPU is the blended monthly revenue per paying customer, so MRR needs no separate plan mix.',
  },
  { id: 'arr', name: 'ARR', formula: 'MRR × 12' },
  {
    id: 'new-mrr',
    name: 'New MRR',
    formula: 'new customers × this month’s ARPU',
    note: 'Valued at the current period’s ARPU, which is what makes the bridge below reconcile exactly.',
  },
  {
    id: 'expansion-mrr',
    name: 'Expansion MRR',
    formula: 'last month’s customers × (this month’s ARPU − last month’s ARPU)',
    note: 'Upgrades, seats and add-ons. Lifts revenue without adding customers.',
  },
  {
    id: 'churned-mrr',
    name: 'Churned MRR',
    formula: 'churned customers × this month’s ARPU',
    note: 'Lost customers valued at today’s ARPU rather than the price they signed up at.',
  },
  {
    id: 'net-new-mrr',
    name: 'Net new MRR',
    formula: 'new MRR + expansion MRR − churned MRR',
    note: 'By construction this equals the change in MRR month over month, so the bridge always ties out.',
  },
  {
    id: 'mrr-growth',
    name: 'MRR growth',
    formula: '(this month’s MRR − last month’s MRR) ÷ last month’s MRR',
  },
  {
    id: 'arpu',
    name: 'ARPU',
    formula: 'a single input: blended revenue per customer per month',
    note: 'Today’s MRR is customers × ARPU. It then compounds monthly at the expansion rate.',
  },
  {
    id: 'cac',
    name: 'CAC',
    formula: 'monthly sales & marketing spend ÷ new customers in month 1',
    note: 'Held constant across the projection, so spend rises and falls with acquisition volume instead of staying flat. You can also enter CAC directly.',
  },
  {
    id: 'ltv',
    name: 'LTV',
    formula: 'ARPU × gross margin ÷ monthly churn',
    note: 'Cumulative gross profit over an average lifetime of 1 ÷ churn months. Expansion is deliberately excluded to keep it conservative — net revenue retention covers expansion instead.',
  },
  {
    id: 'ltv-cac',
    name: 'LTV : CAC',
    formula: 'LTV ÷ CAC',
    note: 'Undefined when CAC is zero or churn is zero, because the ratio genuinely has no answer then.',
  },
  {
    id: 'payback',
    name: 'CAC payback',
    formula: 'CAC ÷ (ARPU × gross margin)',
    note: 'Months of gross profit from one customer to repay the cost of acquiring them.',
  },
  {
    id: 'gross-margin',
    name: 'Gross margin',
    formula: 'an input: revenue left after cost of revenue',
    note: 'Gross profit = revenue × gross margin.',
  },
  {
    id: 'net-cash-flow',
    name: 'Net cash flow',
    formula: 'gross profit − sales & marketing − operating expenses',
    note: 'Operating expenses exclude cost of revenue and sales & marketing, so nothing is counted twice.',
  },
  {
    id: 'net-burn',
    name: 'Net burn',
    formula: 'max(0, −net cash flow)',
    note: 'Zero when the business is cash-flow positive.',
  },
  {
    id: 'runway',
    name: 'Runway',
    formula: 'interpolated months until the projected cash balance reaches zero',
    note: 'Not cash ÷ a fixed burn: it uses the whole projection, so revenue growth correctly extends runway. Reported as “not applicable” when cash flow is not negative.',
  },
  {
    id: 'break-even',
    name: 'Break-even MRR',
    formula: 'operating expenses ÷ (gross margin − churn × CAC ÷ ARPU)',
    note: 'The steady-state MRR where net cash flow reaches zero, assuming acquisition at exactly replacement rate and no expansion. If that denominator is negative, break-even is unreachable at any scale and the app says so instead of inventing a number.',
  },
  {
    id: 'nrr',
    name: 'Net revenue retention',
    formula: '(opening MRR + expansion MRR − churned MRR) ÷ opening MRR',
    note: 'A single-cohort approximation on a monthly basis: it isolates expansion against churn and excludes new customers. At or above 100% the existing base grows on its own.',
  },
  {
    id: 'retention',
    name: 'Customer retention',
    formula: '1 − monthly churn',
  },
];

export interface ModelNote {
  id: string;
  title: string;
  body: string;
}

export const MODEL_NOTES: ModelNote[] = [
  {
    id: 'today-vs-flows',
    title: 'Balances are today, flows are the next 30 days',
    body: 'MRR, ARR, customers and cash are point-in-time balances. New customers, churn, MRR movements and cash flow describe the month ahead. The projection starts from today.',
  },
  {
    id: 'one-model',
    title: 'One model, not twenty calculators',
    body: 'Every figure on every screen comes from a single monthly simulation of the model you entered. There is no formula in the interface, so nothing can disagree with anything else.',
  },
  {
    id: 'acquisition',
    title: 'Acquisition is held constant',
    body: 'Whether it comes from the funnel or a flat number, monthly acquisition does not grow on its own. With a fixed funnel, customers plateau where new customers equal churned customers — that is a real outcome of the assumptions, not a ceiling imposed by the app.',
  },
  {
    id: 'modes',
    title: 'Three ways to drive growth',
    body: 'Bottom-up from visitors and conversion rates, a flat number of new customers, or a target MRR growth rate that acquisition is solved backwards from. All three feed the same engine, so churn, LTV and runway behave identically.',
  },
  {
    id: 'costs',
    title: 'What counts as operating expenses',
    body: 'Operating expenses cover R&D and G&A only. Cost of revenue is handled by the gross margin, and sales & marketing is derived from CAC × new customers, so no cost is double counted and none is hidden.',
  },
  {
    id: 'expansion',
    title: 'Expansion lifts revenue, not headcount',
    body: 'The expansion rate raises ARPU each month, which raises MRR from the customers you already have. It never creates customers.',
  },
  {
    id: 'excluded',
    title: 'What this model deliberately leaves out',
    body: 'Taxes, interest, financing, one-off costs, multi-year contracts, prepaid annual plans, seat-level plan mixes and hiring ladders. Each one adds inputs without changing the shape of the answer, so they are out rather than half-implemented.',
  },
  {
    id: 'privacy',
    title: 'Your model never leaves the browser',
    body: 'Everything is computed locally and saved in this browser. Nothing is uploaded, and there is no account. A shared link carries the assumptions in the URL itself.',
  },
  {
    id: 'rounding',
    title: 'Rounding',
    body: 'Calculations run at full precision; only the display is rounded. Totals shown in the interface are therefore consistent with each other even when they look like they should differ by a cent.',
  },
];
