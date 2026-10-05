## 2025-05-18 - Cache Intl.NumberFormat instances to prevent allocation bottlenecks

**Learning:** Uncached `new Intl.NumberFormat(...)` calls inside formatting functions create substantial runtime overhead (~15-18x slower) when rendering tables, charts, or slider scrubbing that format hundreds of numbers per frame.
**Action:** Always internalize/cache `Intl.NumberFormat` instances by configuration options or currency/locale keys in helper formatters.

## 2025-05-19 - Cache Intl.DateTimeFormat instances and date label maps for projection rendering

**Learning:** Uncached `new Intl.DateTimeFormat(...)` calls and repeated date parsing (`new Date(...)`) in chart x-axis/table label generators (e.g. `monthLabels`) cause major CPU bottlenecks (~110x overhead) when called repeatedly on table row hover and chart cursor interactions.
**Action:** Cache both the `Intl.DateTimeFormat` instance at module scope and the formatted label strings by ISO date key.

## 2025-05-20 - Prevent chart geometry re-computation by memoizing series and filter arrays

**Learning:** Creating intermediate filtered series arrays (e.g., `series.filter(...)`) or passing inline arrow functions (`yFormat={(v) => fmt.moneyCompact(v)}`) in parent components creates new array and function references on every render frame. This invalidates `useMemo` hooks inside chart components (such as `LineChart` and `BarChart`) on every crosshair hover or mousemove event, forcing expensive re-evaluations of `valueExtent`, `niceDomain`, tick formatting, and SVG scales.
**Action:** Wrap internal array filtering in `useMemo` inside chart components, memoize parent chart series with `useMemo`, and pass stable formatter method references (`fmt.moneyCompact`) directly.
