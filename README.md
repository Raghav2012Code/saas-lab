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
and cash balance, each with a month-by-month table. Hovering a table row moves the
crosshair on every chart; hovering a chart highlights the matching row; column headers
trace their column and explain their formula.

**Scenarios** — conservative, base and aggressive side by side, with the series
independently switchable. They are stated multipliers applied to your model, and each
one lists exactly what it changed. Neither is presented as the right answer; the point
is to see which assumptions matter.

**What if** — eight levers (churn, pricing, CAC, acquisition volume, signup
conversion, expansion, gross margin, expenses). Drag one and the whole dashboard shows
the hypothetical as a ghost value with a delta against your model. Apply it or discard
it; nothing changes until you say so.

**Reading a chart.** Hover for a card carrying the period, every series value and the
change since the previous period; click to pin it; click a legend key to hide a series.
Arrows step, Enter pins, Escape releases.

## Editing without fear

- **Undo and redo.** Every assumption change is reversible, from the top bar or with
  `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` (or `Ctrl+Y`). A drag coalesces into one step
  rather than fifty, and re-entering a value you already have adds nothing to the stack.
- **Per-field reset.** A field that differs from its default shows a restore control,
  so "what have I changed?" and "put that one back" are both one click. Double-clicking
  a field label does the same.
- **Adopt a scenario.** Each scenario panel can replace your assumptions with it —
  useful when a comparison makes the case for slower churn or a bigger funnel.
- **`Escape` discards a running what-if** from anywhere, and an active preview keeps its
  Apply / Discard bar pinned below the header so it is reachable however far you scroll.
- **Switching tabs starts at the top**, and changing your mind is always cheaper than
  getting the number right the first time.

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
- **Responsive by redesign, not by shrinking**: below 1024px the assumptions rail
  becomes a modal drawer with a close button and backdrop dismissal, the tab
  group wraps rather than hiding a tab, the KPI grid steps 4 → 2 → 1 column, and
  the header drops its wordmark so the controls keep one row. Verified with zero
  horizontal overflow from a 320px phone through a 2560px display, in portrait and
  landscape, with `env(safe-area-inset-*)` respected on notched devices and 16px
  fields so iOS does not zoom on focus.
- **Deliberately out of scope**: taxes, financing, multi-year contracts, prepaid
  annual plans, plan-level seat mix, and hiring ladders. Each would add inputs
  without changing the shape of the answer.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
npm run contrast    # WCAG AA contrast gate for every token pair, both themes
npm run build       # typecheck + production build
npm run check       # all of the above
```

Lighthouse reports **Accessibility 100, Best Practices 100, SEO 100**, with no
console errors. Every interactive target is at least 24px, the heading outline is
h1 → h2 → h3, and both themes pass the contrast gate.

`DESIGN.md` records the visual system, the reasoning behind it, and the full
audit trail of what was found and fixed.
