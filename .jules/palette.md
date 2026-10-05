## 2026-10-05 - Arrow Key Navigation for Segmented Button Groups
**Learning:** Segmented button groups in this design system act as single-choice controls (e.g. view tabs, horizon selectors, modes). Keyboard users expect Arrow keys (Left/Right/Up/Down) as well as Home/End keys to switch selection and focus between options seamlessly without needing to tab through every button in the group.
**Action:** Include `onKeyDown` handlers in button group controls to handle arrow key navigation and focus management on option selection.
