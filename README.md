# SaaS Calculator

Enter your SaaS assumptions once, and every important metric recalculates together —
MRR, ARR, customers, churn, LTV, CAC payback, runway, break-even and the projections
that follow from them.

It is deliberately **one financial model, not twenty calculators**. Change monthly
churn from 3% to 5% and you will see it move customer count, MRR, ARR, LTV, LTV:CAC,
net revenue retention, break-even and runway — because all of those read from the same
simulation. Nothing in the interface contains a formula.

```bash
npm install
npm run dev      # http://localhost:5173
```

## What it does

**Overview** — eight headline figures (MRR, ARR, customers, growth, LTV:CAC, CAC
payback, gross margin, runway), an MRR projection, next month's MRR bridge
(opening → new → expansion → churned → closing), unit economics, the acquisition
funnel with its conversion rates, a monthly P&L, and the what-if surface.

**Projections** — 12, 24 or 36 months of MRR, customers, revenue against total costs,
and cash balance, each with a month-by-month table you can export.

**Scenarios** — conservative, base and aggressive side by side. They are stated
multipliers applied to your model, and each one lists exactly what it changed. Neither
is presented as the right answer; the point is to see which assumptions matter.

**What if** — eight levers (churn, pricing, CAC, acquisition volume, signup
conversion, expansion, gross margin, expenses). Drag one and the whole dashboard shows
the hypothetical as a ghost value with a delta against your model. Apply it or discard
it; nothing changes until you say so.

**Methodology** — every formula, every global assumption and every benchmark range,
including the ones that differ between SaaS practitioners, stated plainly.

## Assumptions you can make

Three ways to drive growth, all feeding the same engine:

- **Funnel** — visitors × visitor→signup × signup→paid
- **Flat** — a fixed number of new customers per month
- **Target** — solved backwards from a monthly MRR growth rate

CAC either comes from a sales & marketing budget divided by new customers, or is
entered directly. Retention, pricing, costs, and your starting position make up the
rest. Drag any label to scrub its value; arrow keys and typing work too.

## Under the hood

```
src/engine/     the model — pure, deterministic, independently testable
src/state/      one store: the model, the what-if preview, persistence, share links
src/components/ ui primitives, hand-built SVG charts, layout, dashboard panels
```

- **One simulation** (`engine/model.ts`) runs the model forward monthly. Month 0 is
  today's balances; flows describe the next 30 days.
- **Every metric** is derived in `engine/metrics.ts` and returns either a number or
  `null` plus a plain-language reason. `Infinity` and `NaN` are not reachable states
  in this codebase.
- **39 tests** (`npm test`) cover the edge cases that matter: zero and one customer,
  zero and 100% churn, zero CAC, zero revenue, 0% and 100% gross margin, a
  fully-profitable business, unreachable break-even, and extreme inputs. They also
  assert internal consistency — net new MRR must equal the change in MRR every month,
  and cash must equal starting cash plus cumulative cash flow.
- **Charts are hand-built SVG**, so hover, touch, keyboard inspection and tooltips
  behave identically everywhere and no charting dependency ships.

## Notes

- **No account, no backend.** The model is saved in your browser and computed
  locally. Nothing is uploaded.
- **Share links** encode the whole model in the URL hash, so a link is the whole
  model. Paste one into an open tab and it loads.
- **Export**: projection CSV, assumptions CSV, model JSON, print/PDF.
- **Currency**: USD, EUR, GBP, INR, formatted through `Intl` throughout — including
  compact forms such as `₹1.2 Cr` on chart axes.
- **Deliberately out of scope**: taxes, financing, multi-year contracts, prepaid
  annual plans, plan-level seat mix, and hiring ladders. Each would add inputs
  without changing the shape of the answer.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
npm run build       # typecheck + production build
npm run check       # all of the above
```

`DESIGN.md` records the visual system and the reasoning behind it.
