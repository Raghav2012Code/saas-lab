# Spec — SaaS Calculator

**Status:** implemented and shipped. This document is the synthesis of what was
built, written as the spec the work satisfies. It is a single-spec record rather
than a queue item: the acceptance criteria below are already met and verified.

---

## Problem Statement

Someone building or running a SaaS business has to answer the same questions over
and over: is growth actually happening, does one more customer pay for themselves,
how many months of cash are left, and what happens to all of that if churn is
worse than believed?

The tools available make this worse, not better. A spreadsheet works until a
number changes, then every dependent formula has to be found and fixed by hand,
and nothing tells you which assumption actually mattered. A page of separate
calculators has the opposite failure: each one is independently plausible, and
none of them agree with each other, because they are not one model.

The user wants to enter their assumptions once and watch every metric move
together, so that changing a number teaches them something instead of creating a
maintenance problem.

## Solution

One page, one model. The user enters their assumptions in a persistent rail beside
the numbers; every figure on every view comes from a single monthly simulation, so
nothing can disagree with anything else. There is no formula anywhere in the
interface.

Three habits shape the experience:

- **Metric movement is visible.** Change an assumption and the dependent metrics
  change, in front of you, with no recalculate button.
- **Hypotheses are separable from decisions.** A what-if can be explored across
  the whole dashboard and then applied or discarded; a scenario can be put on and
  taken off; every change is undoable.
- **Nothing lies to stay tidy.** Where a metric genuinely has no answer — zero
  churn makes LTV unbounded, a zero CAC has no payback ratio — the product says
  so, with the reason, rather than printing a fabricated zero or an infinity.

## User Stories

1. As a founder, I want to enter my assumptions once, so that I do not maintain
   the same number in several places.
2. As a founder, I want every metric derived from those assumptions, so that the
   numbers agree with each other by construction.
3. As a founder, I want to see MRR, ARR and customers at a glance, so that I know
   the state of the business in seconds.
4. As a founder, I want the change since last month alongside each balance, so
   that a number means something without me having to remember the old one.
5. As a founder, I want to see monthly recurring revenue projected forward, so
   that I can judge whether the shape of the business is what I intend.
6. As a founder, I want to choose a projection horizon of 12, 24 or 36 months, so
   that I can look as far ahead as is useful.
7. As a founder, I want the movements that produced next month's MRR — new,
   expansion and churned — so that I can see where growth actually comes from.
8. As a founder, I want unit economics — revenue per customer, gross profit per
   customer, LTV, CAC, the ratio and the payback period — so that I know whether
   acquiring a customer is worth doing.
9. As a founder, I want my acquisition funnel expressed as rates, so that I can
   see which step is leaking.
10. As a founder, I want to see how many visitors each paying customer costs, so
    that I understand the true price of a customer.
11. As a founder, I want retention and expansion expressed as rates, so that I can
    find the one worth fixing first.
12. As a founder, I want net revenue retention, so that I know whether the base
    would grow without any new customers.
13. As a founder, I want a monthly profit and loss statement, so that I can see
    where the money goes in order.
14. As a founder, I want net cash flow and net burn per month, so that I know how
    much the business consumes.
15. As a founder, I want runway measured against the whole projection rather than
    a fixed burn rate, so that growth correctly extends it.
16. As a founder, I want to know the month cash runs out, and the month break-even
    is reached, so that I can plan around both.
17. As a founder, I want the MRR required to break even, so that I have a target
    rather than a feeling.
18. As a founder, I want to be told when break-even is unreachable at any scale,
    so that I do not plan for a number that does not exist.
19. As a founder, I want to model growth three ways — from a funnel, from a flat
    number of new customers, or from a target growth rate — so that I can start
    from whichever I actually know.
20. As a founder, I want CAC either derived from a marketing budget or entered
    directly, so that the model matches how I actually spend.
21. As a founder, I want to drag a label to change a number, so that exploring a
    range is a gesture rather than a series of typed guesses.
22. As a founder, I want to type a value and step it with the arrow keys, so that
    the drag gesture is never the only way.
23. As a founder, I want to see where a value sits within its plausible range while
    I drag it, so that I know when I have left normal territory.
24. As a founder, I want an assumption that looks unusual to be flagged inline, so
    that I catch a typo before I trust the output.
25. As a founder, I want to be told which assumptions would make the output
    misleading, so that the numbers are never more confident than the inputs.
26. As a founder, I want to compare conservative, base and aggressive assumptions
    side by side, so that I can see how much the outcome depends on optimism.
27. As a founder, I want each comparison to list exactly what it changed, so that
    the comparison is inspectable rather than a black box.
28. As a founder, I want to adopt a scenario's assumptions, so that a comparison
    can become my plan.
29. As a founder, I want neither scenario presented as the right answer, so that
    the tool informs a decision instead of making it.
30. As a founder, I want to move a what-if lever and see the hypothetical alongside
    my own numbers everywhere, so that I can judge a change before committing.
31. As a founder, I want to apply or discard a what-if, so that exploring has no
    consequences I did not choose.
32. As a founder, I want to back out of a what-if with Escape, so that I do not
    have to find a button.
33. As a founder, I want to undo and redo, so that a mis-drag costs one keystroke.
34. As a founder, I want a drag to count as one undo step rather than fifty, so
    that undo means the last thing I did.
35. As a founder, I want to restore a single assumption to its default, so that I
    can recover one field without resetting the model.
36. As a founder, I want to see which assumptions I have changed, so that I know
    where my model differs from the starting point.
37. As a founder, I want to hover a chart and see the value under the pointer, so
    that reading a trend does not require guesswork.
38. As a founder, I want the card to tell me the movement since the previous
    period, so that the value arrives with its context.
39. As a founder, I want to pin a point so the value stays while I read it, so that
    I can compare two months without holding the pointer still.
40. As a founder, I want to hide a series from a legend, so that two series can be
    compared without a third in the way.
41. As a founder, I want to inspect a chart with only the keyboard, so that the
    data is not locked behind a pointer.
42. As a founder, I want to hover a table row and see that month highlighted on the
    charts, so that the two views act as one.
43. As a founder, I want to hover a column header and trace the column, so that I
    can follow one metric down a long table.
44. As a founder, I want each column to explain its own formula, so that the
    definition is where the number is.
45. As a founder, I want event months — cash out, break-even — marked in the table,
    so that I can find them without scanning every row.
46. As a founder, I want the projection as a table of raw numbers, so that I can
    check any row against the rest of the model myself.
47. As a founder, I want to export the projection as CSV, so that I can use it in a
    spreadsheet or a board deck.
48. As a founder, I want to export my assumptions and the model itself, so that I
    can keep a copy or hand it to someone else.
49. As a founder, I want to print or save a PDF of a view, so that I can share the
    whole thing without a screenshot.
50. As a founder, I want a link that carries the entire model, so that sharing my
    assumptions does not mean describing them.
51. As a founder, I want my model saved in my browser, so that returning to the tab
    does not lose it.
52. As a founder, I want no account and no upload, so that my numbers stay mine.
53. As a founder, I want to choose my currency, so that the tool speaks in the money
    I actually use.
54. As a founder, I want every formula, assumption and benchmark written down in the
    product, so that I can judge the model rather than trust it.
55. As a founder, I want the methodology to name the places where SaaS definitions
    differ, so that I know which convention I am looking at.
56. As a user on a phone, I want the assumptions in a drawer I can close, so that
    the numbers get the screen.
57. As a user on a phone, I want to close that drawer by tapping outside it or with
    a visible control, so that I am never stuck in it.
58. As a user on a phone, I want charts that do not swallow my scrolling, so that
    the dashboard is navigable by thumb.
59. As a user on any device, I want no horizontal scrolling of the page, so that the
    layout fits the screen it is on.
60. As a user on a notched phone, I want nothing hidden behind the notch or the home
    indicator, so that every control is reachable.
61. As a user on a phone, I want text fields that do not trigger a zoom on focus, so
    that typing does not jump the layout.
62. As a user on a short landscape screen, I want the whole rail still reachable, so
    that orientation does not cost me a control.
63. As a keyboard user, I want a visible focus indicator that is never hidden behind
    the sticky header, so that I can see where I am.
64. As a keyboard user, I want to reach and operate everything without a mouse, so
    that no feature is mouse-only.
65. As a screen reader user, I want the charts' values available as text, so that a
    picture is not the only carrier of the data.
66. As a low-vision user, I want AA contrast in both light and dark modes, so that I
    can read the interface without straining.
67. As a user of high-contrast mode, I want chart series to remain distinguishable,
    so that a comparison survives without colour.
68. As a user, I want the interface to respect reduced-motion settings, so that it
    does not move in a way that makes me unwell.
69. As a user, I want dark mode designed rather than inverted, so that it is
    comfortable for long sessions.
70. As a maintainer, I want the calculation layer separate from the interface, so
    that it can be tested without rendering anything.
71. As a maintainer, I want the engine to be deterministic, so that the same
    assumptions always produce the same numbers.
72. As a maintainer, I want contrast asserted automatically, so that a palette tweak
    cannot silently break legibility.
73. As a maintainer, I want the interface free of financial formulas, so that there
    is exactly one place where a definition lives.
74. As a maintainer, I want the design system recorded and the reasoning with it, so
    that the next change is made deliberately.
75. As an AI agent working on this repo later, I want the constraints written down, so
    that I do not re-litigate settled decisions.

## Implementation Decisions

**One simulation, not many calculators.** A single monthly simulation walks the
model forward. Today is period zero and carries balances; each subsequent month
carries flows and balances together. Every figure on every screen reads from it.
The identity that makes this trustworthy — net new MRR equals the change in MRR,
every month — holds by construction, because churned MRR is valued at the current
period's revenue per customer rather than the price the customer signed up at.

**A derived value is a number or a reason, never a guess.** Every computed metric
returns either a value or null plus a plain-language explanation. `Infinity` and
`NaN` are unreachable states in the interface, because they are unrepresentable in
the engine's output type. This is what lets the product say "not applicable, and
here is why" in the corners where a spreadsheet would print a number.

**Assumptions are a typed, single-source structure.** Each numeric assumption is
declared once, with its bounds, its unit, its scrub increment, its help text and
its plausibility warnings. The rail, the what-if levers, the scenario presets, the
validation and the methodology table all read that one declaration, so a new
assumption cannot be added to the input and forgotten in the copy.

**Three acquisition modes and two CAC modes behind one seam.** How new customers
are determined (funnel, flat, or a growth target solved backwards) is a strategy
inside the simulation, not three simulations. The same is true of whether CAC is
derived from a budget or entered directly. Scenarios, churn, LTV and runway behave
identically whichever is chosen.

**The URL is the transport for sharing.** A model encodes into the hash, so a link
is the whole model and no backend is involved. The hash is consumed on load so an
edit is not reverted by a refresh, and a paste into an already-open tab is
honoured.

**Hypotheses are separate from the model.** The what-if layer is a second value the
store holds, not a mutation: the committed model and the preview are both
simulated, and the interface shows the hypothetical as a ghost with the delta
against the user's own figure. Applying it is an ordinary, undoable edit. The same
separation makes pinning safe — hovering always overrides a pin, so exploring is
never blocked by a value the user stopped on.

**Undo is a property of the model, not of individual controls.** History lives in
the model store, so every path that changes an assumption participates — the rail,
the scrub gesture, currency, scenarios, the what-if apply, reset. Consecutive
changes to the same field inside a short window coalesce into one step, and
committing a value that is already set adds nothing, so undo maps to the user's
sense of the last thing they did rather than to keystrokes.

**Charts are built, not installed.** The chart layer is a small set of primitives
— scales, tick selection, a plot frame, a hover band, a readout card — composed
into a line/area chart, a signed bar chart, a waterfall bridge and a funnel. This
was chosen so hover, touch, keyboard and tooltips behave identically across every
chart and in every host, and so the card can be repositioned rather than hidden at
narrow widths. A single coordinate conversion helper maps a pointer position into
the chart's own space, allowing for an SVG that has been scaled to fit.

**Panel and chart containers must be shrinkable.** An SVG with an explicit pixel
width contributes to its ancestors' min-content size. Every panel and chart wrapper
therefore declares a zero minimum width, and no chart imposes a width floor. Without
this the layout could not be narrower than the widest chart, and the page overflowed
on small screens.

**Layout offsets are measured, not guessed.** The sticky header and the mobile
action bar are content-sized — the header wraps to two or three rows on a phone, and
the bar grows with a device's safe-area inset. Their heights are measured at runtime
and published as CSS variables, and everything that must clear them reads those
variables: the sticky rail, the what-if bar, the scroll margin that keeps focused
elements out from under the header, and the toast.

**The interface is responsive by redesign.** Below the desktop breakpoint the
assumptions rail becomes a modal drawer built on the native dialog element, which
supplies focus trapping and a real backdrop; the drawer's own contents mount only
while open, so the document never holds two copies of every input and label. The
metric grid steps its column count with width, the tab group wraps rather than
hiding a tab, and the wordmark gives way to the brand mark so the toolbar keeps one
row. Wide content — tables — scrolls inside its own container rather than widening
the page.

**Design is constrained by tokens and checked by a gate.** Colour is authored in
OKLCH as semantic tokens with light and dark values, mapped into the utility layer so
theming swaps values rather than classes. Typography has a stated ratio and explicit
floors. A repository script converts the tokens and asserts every
foreground/background pair in both themes against WCAG AA, and it runs as part of the
test command, so a palette change cannot quietly fail legibility.

**Testing decisions are encoded as a harness, not a habit.** The engine's test suite
asserts internal consistency — the MRR identity, the cash reconciliation, a
break-even figure that actually produces break-even — alongside edge cases and a
finite-number sweep. A separate scripted check runs the app in a browser at a range
of true viewport widths and asserts no horizontal overflow, that measured layout
variables match reality, and that no interactive target falls below the minimum size.

## Testing Decisions

A good test here asserts **observable behaviour**, not structure: a number a user
would see, a relationship between two numbers, or a statement about the page that a
user could check. Tests should not reach into component internals or assert on
implementation shape, because the whole point of the architecture is that the
interface is a view over one model — a test that mirrors that structure tests
nothing.

**Engine tests are the primary seam and the highest one available.** The simulation
and the metric derivation are the external contract of the calculation layer: given
a set of assumptions, these are the numbers. Prior art in this repository is the
existing engine suite, which already covers the internal identities, the edge cases
(no customers, one customer, zero and total churn, zero and total gross margin, a
profitable business, unreachable break-even), a sweep asserting every emitted number
is finite across extreme inputs, and the round trip of a shared model.

**Interaction decisions are tested through the store's public surface.** The
what-if layer, scenario derivation and undo are tested by driving them as a caller
would — apply a preset, move a lever, undo a change — and asserting on the resulting
model and derived metrics, never on the store's internals.

**Layout and accessibility are tested in a browser, scripted rather than by eye.**
The seams are the rendered page at real viewport widths, and the assertions are
observable ones: no horizontal overflow, measured layout variables equal to measured
element heights, no interactive target below the minimum, and a contrast sweep of
every token pair in both themes. This is deliberately separate from the unit tests,
because these properties only exist once the page is laid out.

**What is not tested automatically, and should be said plainly:** real mobile
hardware, real screen readers, print output on a physical printer, and the
qualitative "does this feel considered" judgement. These were checked by inspection
during development and remain manual.

## Out of Scope

- **Anything requiring a backend.** No accounts, no server-side storage, no
  collaboration, no telemetry. Sharing is by URL because that is sufficient.
- **Taxes, interest, financing and one-off costs.** Each adds inputs without
  changing the shape of the answer.
- **Multi-year contracts, prepaid annual plans, and plan-level seat mix.** These
  change revenue timing rather than the structure of the model, and modelling them
  properly needs a different simulation.
- **Hiring ladders and headcount planning.** Operating expenses are a direct
  assumption with an optional growth rate; a headcount model is a different product.
- **Cohort-level retention.** Retention is a single monthly rate, and net revenue
  retention is a single-cohort approximation, both documented as such.
- **Server-rendered or indexed pages.** This is a tool, not a content site.
- **Multi-currency models.** One currency per model; changing it re-labels, it does
  not convert.
- **A component library, theming API, or plugin surface.** The design system is
  internal and documented, not published.

## Further Notes

**The definitions are the product.** Where SaaS practice disagrees — what belongs in
LTV, whether break-even is steady-state or path-dependent, whether churn is valued at
the current or original price — the choice made is stated in the interface, in the
same place as the metric, rather than left implicit. Two convention calls are
deliberate and worth preserving: lifetime value excludes expansion so that it stays
conservative, and break-even is a steady-state figure assuming acquisition at
replacement rate.

**Two visual decisions are deliberate deviations.** Focus indicators use outlines
rather than shadows, because outlines cannot be clipped by a scrolling ancestor and
modern browsers follow border radius; and decorative rules sit below the contrast
threshold that governs component boundaries, because 1.4.11 applies to information
that identifies a component or state, which the boundary token owns.

**The design record is the contract.** The repository's design document carries the
aesthetic commitment, the token table, the craft decisions and an audit trail of
every finding and its resolution. It is the artefact to read before changing
anything visual, and it should be updated rather than bypassed.

**A note on the retroactive nature of this spec.** The work described here is
complete and verified. If it is published to a tracker, the honest labels are
"implemented" or "shipped" rather than a queue label that implies an agent should
now build it. It exists primarily so the requirements, the reasoning and the
deliberate deviations are traceable to someone — human or agent — who arrives later
and wonders why something is the way it is.
