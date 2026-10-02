## 2025-05-18 - Cache Intl.NumberFormat instances to prevent allocation bottlenecks

**Learning:** Uncached `new Intl.NumberFormat(...)` calls inside formatting functions create substantial runtime overhead (~15-18x slower) when rendering tables, charts, or slider scrubbing that format hundreds of numbers per frame.
**Action:** Always internalize/cache `Intl.NumberFormat` instances by configuration options or currency/locale keys in helper formatters.
