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
    note: 'ARPU is the average monthly revenue per paying customer, so MRR needs no separate per-plan breakdown.',
  },
  { id: 'arr', name: 'ARR', formula: 'MRR × 12' },
  {
    id: 'new-mrr',
    name: 'New MRR',
    formula: 'new customers × this month’s ARPU',
    note: 'Valued at this month’s revenue per customer, which is what makes the figures below add up exactly.',
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
    note: 'This always equals the change in MRR month over month, so the figures always add up.',
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
    note: 'Today’s MRR is customers × ARPU. It then grows monthly at the expansion rate.',
  },
  {
    id: 'cac',
    name: 'CAC',
    formula: 'monthly sales & marketing spend ÷ new customers in month 1',
    note: 'Held fixed across the projection, so spending rises and falls with the number of new customers instead of staying flat. You can also enter CAC directly.',
  },
  {
    id: 'ltv',
    name: 'LTV',
    formula: 'ARPU × gross margin ÷ monthly churn',
    note: 'Total gross profit added up over an average lifetime of 1 ÷ churn months. Extra revenue from existing customers is left out to keep it cautious — net revenue retention covers that instead.',
  },
  {
    id: 'ltv-cac',
    name: 'LTV : CAC',
    formula: 'LTV ÷ CAC',
    note: 'Not shown when CAC is zero or churn is zero, because the ratio genuinely has no answer then.',
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
    note: 'Zero when the business brings in more cash than it spends.',
  },
  {
    id: 'runway',
    name: 'Runway',
    formula: 'interpolated months until the projected cash balance reaches zero',
    note: 'Not cash divided by one fixed spending figure: it uses the whole projection, so revenue growth correctly extends runway. Reported as “not applicable” when cash flow is not negative.',
  },
  {
    id: 'break-even',
    name: 'Break-even MRR',
    formula: 'operating expenses ÷ (gross margin − churn × CAC ÷ ARPU)',
    note: 'The monthly revenue where incoming and outgoing cash balance out, if new customers only replace those who leave and existing customers don’t spend more. If costs swallow the profit at every size, break-even can’t be reached no matter how big the business gets, and the app says so instead of inventing a number.',
  },
  {
    id: 'nrr',
    name: 'Net revenue retention',
    formula: '(opening MRR + expansion MRR − churned MRR) ÷ opening MRR',
    note: 'How the revenue from customers you already had changes in a month: extra spending minus cancellations, ignoring new customers. At or above 100% that base grows on its own.',
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
    body: 'MRR, ARR, customers and cash are snapshots of right now. New customers, churn, MRR movements and cash flow describe the month ahead. The projection starts from today.',
  },
  {
    id: 'one-model',
    title: 'Everything comes from one simulation',
    body: 'Every figure on every screen comes from a single monthly simulation of the model you entered. There is no formula in the interface, so nothing can disagree with anything else.',
  },
  {
    id: 'acquisition',
    title: 'Acquisition is held constant',
    body: 'Whether it comes from the funnel or a flat number, monthly acquisition does not grow on its own. With a fixed funnel, customers level off where new customers equal customers who leave — that is a real outcome of the assumptions, not a ceiling imposed by the app.',
  },
  {
    id: 'modes',
    title: 'Three ways to drive growth',
    body: 'Starting from visitors and conversion rates, a flat number of new customers, or a target MRR growth rate that new customers are worked out backwards from. All three use the same calculation, so churn, lifetime value (LTV) and runway behave identically.',
  },
  {
    id: 'costs',
    title: 'What counts as operating expenses',
    body: 'Operating expenses cover R&D and G&A only. Cost of revenue is handled by the gross margin, and sales & marketing is derived from customer acquisition cost (CAC) × new customers, so no cost is double counted and none is hidden.',
  },
  {
    id: 'expansion',
    title: 'Expansion lifts revenue, not headcount',
    body: 'The expansion rate raises revenue per customer (ARPU) each month, which raises MRR from the customers you already have. It never creates customers.',
  },
  {
    id: 'excluded',
    title: 'What this model deliberately leaves out',
    body: 'Taxes, interest, financing, one-off costs, multi-year contracts, prepaid annual plans, seat-level plan mixes and hiring ladders. Each one would add inputs without changing what the answer looks like, so they are left out rather than half done.',
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
