# Palette UX & Accessibility Journal

## 2026-10-06 - Tooltips on Disabled Buttons Pattern
**Learning:** HTML elements with `disabled` attribute ignore pointer events in standard DOM implementations, preventing tooltips from appearing when users hover over disabled buttons to understand why they are disabled.
**Action:** Wrap disabled buttons in a container (`span` or `div`) with `cursor-not-allowed` and add `disabled:pointer-events-none` to the button element. This passes pointer events to the wrapper element so tooltips render reliably while maintaining disabled accessibility states.
