## 2024-05-24 - Replace JS hover state with CSS
**Learning:** React state-based hover effects (e.g. `onMouseEnter={() => setIsHovering(true)}`) cause full component re-renders. For static visual changes, native CSS pseudo-classes (`hover:`) are far more performant.
**Action:** Avoid stateful hovers unless they trigger complex logical or layout changes. Prefer CSS `hover:` utility classes in Tailwind to improve rendering performance.
