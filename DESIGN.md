# DESIGN.md — SaaS Calculator

The single source of truth for how this interface looks and why. If the CSS or a
component drifts from this file, this file wins.

## Discovery

| | |
|---|---|
| **Artifact type** | SaaS application — a data tool with a dashboard core, not a marketing page |
| **Who** | Indie founders and small operators who model their own numbers and do not want a spreadsheet |
| **Primary outcome** | Understand the trajectory of a SaaS business, and see exactly which assumption moves it |
| **Failure to avoid** | Reading like a collection of unrelated calculators, or like a Bootstrap admin template |

**Adjectives:** precise · calm · analytical · trustworthy · quiet-premium.
**Aesthetic essence:** *an instrument panel, not a spreadsheet.*

References transposed rather than copied: Linear (restraint, keyboard-first
density), Stripe (tabular figures, data confidence), Vercel (monochrome
authority), financial terminals (monospaced digits as a design language).

## Committed aesthetic

Monochrome graphite surfaces, one petrol brand hue, colour reserved for meaning.
No gradients, no glow, no glass, no decorative background texture. Hierarchy
comes from type scale, tabular figures, hairline rules and spacing — not from
chrome. Density is high but airy at the section level: tight inside a group,
generous between groups.

**Signature move — causal deltas.** Move a what-if lever and every affected
metric on every tab shows the hypothetical value as a dashed ghost next to the
value you actually have, with a delta chip against your own model. The
interconnection the product is built on is made visible in the interface instead
of being described in copy.

## Typography

Two families, both self-hosted through `@fontsource-variable` (no network
dependency at runtime):

| Role | Face | Notes |
|---|---|---|
| UI and display | **Instrument Sans Variable** | distinctive grotesque, not Inter/Roboto/system |
| All figures, axes, units | **JetBrains Mono Variable** | tabular numerals by default, engineering character |

Every number in the product is monospaced and tabular — `.num`. A metric and its
axis label are guaranteed to align with each other and across panels. Words are
never set in mono.

Scale: **ratio 1.2 on a 15px base**, with an 11px floor for meta text, because
small labels need a size that survives the ratio.

`11 · 12.5 · 14 · 15 · 18 · 21.6 · 25.9 · 31.2 · 37.3 · 44.8px`

Two floors are enforced, not decorative:

- **14px** is the minimum for body copy and for anything interactive (buttons,
  segmented controls, field labels, panel descriptions, table cells). It was
  12.5px, which audited as too small for control text.
- **11px** is the absolute floor, used only for short uppercase labels and
  dense supporting text (metric labels, pills, chart readouts, tooltips). Chart
  axis labels were raised from 10px to 11px to respect it.

Hero figures step down responsively (`text-lg → xl → 2xl → 3xl`) so a large
number can never outgrow its tile at 320px.

Tracking: `-0.014em` on headings, `-0.02em` on figures, `+0.045em` uppercase on
micro-labels.

## Colour

Authored in OKLCH. Dominant neutral, one brand hue, semantic colour used only
where it carries meaning (approximately 60 / 30 / 10).

| Role | Light | Dark |
|---|---|---|
| `bg` | `oklch(0.977 0.003 250)` | `oklch(0.168 0.008 250)` |
| `surface` | `oklch(0.996 0.001 250)` | `oklch(0.208 0.009 250)` |
| `fg` / `fg-strong` | `0.235` / `0.155` L | `0.925` / `0.982` L |
| `muted` (labels, descriptions) | `oklch(0.505 0.013 252)` | `oklch(0.705 0.011 250)` |
| `subtle` (captions, metric labels) | `oklch(0.53 0.011 252)` | `oklch(0.635 0.012 250)` |
| `border-strong` (control boundaries) | `oklch(0.63 0.008 252)` | `oklch(0.52 0.013 250)` |
| `brand` (petrol) | `oklch(0.42 0.072 197)` | `oklch(0.705 0.088 197)` |
| `accent` (provisional) | `oklch(0.63 0.144 62)` | `oklch(0.775 0.128 62)` |
| `success` | `oklch(0.5 0.11 158)` | `oklch(0.735 0.115 158)` |
| `danger` | `oklch(0.53 0.19 26)` | `oklch(0.69 0.155 26)` |

Two values are set by the contrast gate rather than by eye:

- **`subtle`** carries 11px captions, so it must clear 4.5:1 against the *lightest
  surface it sits on* (`surface-2`, used by table headers), not just against
  white. That forces it close to `muted` in value, which is why the two read as
  siblings rather than as a strong hierarchy step.
- **`border-strong`** draws component boundaries (inputs, buttons, tooltips) and
  therefore clears 3:1 per WCAG 1.4.11. `border` stays a hairline: it only draws
  separators and grid lines, which are decorative and exempt.

`npm run contrast` asserts all 46 foreground/background pairs in both themes and
fails the build if any drops below its threshold.

Petrol is deliberately outside the indigo/violet band that AI-generated UI
defaults to, and reads as financial and instrument-like rather than corporate
blue. Amber is the one accent; it is used **only** for the provisional register
(a running what-if, a soft warning). That overlap is intentional and documented
here so nobody "fixes" it: in this product, amber means *not yet true*.

Chart series are four and fixed: petrol `197`, slate blue `262`, amber `62`,
clay `22`. Series colour never encodes good or bad — that is what the semantic
pair is for.

Colour is never the only signal: every delta chip carries a direction arrow and
text, every advisory carries a distinct icon, every benchmark carries a word.

## Tokens

- **Spacing**: 4px base unit. Tight within a group (`gap-1`–`gap-3`), generous
  between sections (`gap-8`–`gap-10`).
- **Radius**: two values only — `6px` controls, `10px` panels — plus pills.
  No blob rounding.
- **Elevation**: defined edges (1px hairlines) everywhere. A shadow exists only
  for overlays (`--shadow-overlay`), never stacked on a bordered element.
- **Motion**: `120ms / 180ms / 300ms`, single ease `cubic-bezier(0.22,1,0.36,1)`,
  transform and opacity only. Reduced motion does not zero every duration; it
  sets the displacement tokens (`--shift`, `--shift-lg`) to `0`, so overlays
  fade instead of sliding. Figures are **not** tweened: an animated number in a
  financial tool is a lie in progress. Nothing animates width, height or
  position.
- **Implementing layer**: Tailwind v4 `@theme inline` mapping runtime CSS
  variables, so `.dark` swaps values without a second set of utilities.

## Craft decisions

- **Layout.** Persistent assumptions rail (336px) + model surface. The rail is
  the control surface, not a settings page, and it never scrolls away from the
  numbers it changes. On small screens it becomes a modal `<dialog>` drawer, so
  Escape, focus trapping and the backdrop are native rather than reimplemented.
- **Metrics first, then the why.** Sections run summary → advisories → revenue →
  unit economics → growth → financial health → what-if. A founder sees the state
  of the business before any methodology.
- **Not every section is a card.** One bordered block holds the eight headline
  figures as a hairline grid; panels are reserved for charts, tables and tools.
- **Components have full state matrices.** Inputs carry hover, focus-within,
  invalid, warning and scrubbing states. Buttons are ranked by importance
  (primary/outline/quiet), not coloured by meaning. Charts expose hover, touch,
  keyboard (arrows/Home/End/Escape) and a fixed-height readout that doubles as
  the mobile tooltip.
- **No honest visual is allowed to lie.** The funnel spans three orders of
  magnitude, so its bars are logarithmic and the chart says so. A metric with no
  answer shows an em dash, a "Not applicable" pill and the reason why — never
  `Infinity`, never a fabricated zero.
- **Accessibility.** WCAG 2.2 AA contrast in both modes, visible focus rings on
  every interactive element, no interactive target below 24px, native form
  controls for select and range, `aria-live` readouts on charts, real
  `<caption>`s on tables, one `<h1>` with an unbroken h1→h2→h3 outline, and a
  print stylesheet that unwinds every scroll container.

## Audit

A full UI/UX pass was run against this build: Lighthouse, an automated contrast
gate, and scripted checks of the rendered page (target sizes, heading outline,
focus occlusion, overflow at 320/360/390/768/1024/1440, both themes). Findings
and their resolutions:

| Finding | Resolution |
|---|---|
| `subtle` captions at 3.13:1 (light) / 4.24:1 (dark) — ~29 nodes | token retuned to 5.2:1 / 4.7:1 worst-case |
| Table headers on `surface-2` below 4.5:1 | header text moved to `muted` |
| Input boundaries at 1.70:1 / 1.82:1 (WCAG 1.4.11) | `border-strong` retuned to 3.27:1 / 3.23:1 |
| Brand link's accessible name didn't match its visible text | dropped `aria-label`, visible text is the name |
| 61 interactive targets under 24px | label handles, info buttons, range inputs and slider resets enlarged to ≥24px |
| Focused elements could land under the sticky header (2.4.11) | `scroll-margin-top` on focusable and anchor targets |
| Field errors not associated with their input | unique ids + `aria-describedby` + `role="alert"` |
| Duplicate ids and doubled label associations (rail rendered twice) | namespaced `idPrefix` per variant; drawer content mounts only while open |
| **Mobile drawer could not be closed by touch** — no close button, backdrop didn't dismiss | close button, backdrop dismissal, explicit Escape handling, and state kept authoritative so it can always reopen |
| Buttons and segmented controls at 11–12.5px | 14px floor for controls and body copy |
| Duplicated eyebrow label above each tab heading | eyebrow removed where it repeated the tab name |
| No `<h1>`; panels and sections both `<h2>` | one `sr-only` `<h1>`, sections `h2`, panels `h3` |
| `border-radius` set on `:focus-visible`, changing element shape on focus | removed |
| Tooltip animated on every hover/focus | animation removed (high-frequency interaction) |
| Reduced motion blanket-zeroed all durations | displacement tokens zeroed, fades kept |
| Toast had an enter animation and no exit | symmetric exit added |
| Export menu appeared with no motion | scales from its trigger (`transform-origin: top right`) |
| Tab strip hid its last tab below ~430px | tab group wraps to a second line |
| Hero figure could outgrow its tile at 320px | responsive value sizes |
| Dead `EmptyState` component; disabled button carrying a tooltip | removed; Reset is always enabled |

Result: Lighthouse **Accessibility 100, Best Practices 100, SEO 100**, zero
failures, in both themes.

Two deviations are deliberate and recorded rather than accidental:

- **Focus rings use `outline`, not `box-shadow`.** The checklist prefers
  box-shadow so the ring follows `border-radius`; modern browsers round outlines
  too, and an outline cannot be clipped by a parent's `overflow`. It meets
  2.4.13's actual requirement: 2px thick at 5.2:1 (light) / 7.45:1 (dark).
- **Decorative rules stay hairlines.** `--border` (panel separators, table row
  rules, chart gridlines) sits below 3:1 by design. WCAG 1.4.11 applies to
  information required to identify a component or state, which is
  `--border-strong`'s job; separators carry no state.

## Slop audit

Checked against the failure catalogue and the artifact-type gate:

- Not a landing page with dashboard furniture: the product is the dashboard, and
  there is no hero, no feature grid, no testimonial block.
- Type and palette match the committed adjectives; no Inter, no system stack as
  the primary face, no indigo/violet, no gradient text, no purple-on-dark.
- No decorative glass, blobs, spotlight glows, grid-line wallpaper, pulsing dots
  or auto-scrolling marquees.
- No icon-tile-above-heading feature cards, no side-tab accent borders, no
  border-plus-diffuse-shadow on the same element.
- Icons are one hand-drawn 16px set, one stroke weight, one join style.
- Motion is limited to overlay entry, the whats-if ghost outline and hover
  affordances, all reduced-motion aware.
- Empty, error and unavailable states exist as first-class designs rather than
  as absences.

Known trade-offs accepted deliberately: the MRR bridge draws its delta bars
against a full-height y-axis, so small movements read as thin bars — an honest
scale rather than an exaggerated one. The what-if impact table scrolls
horizontally on phones, with the metric column pinned, rather than collapsing
into something less comparable.
