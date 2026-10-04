## 2024-05-24 - Avoid isHovering state for hover effects
**Learning:** Using React state (`isHovering`, `setIsHovering`) with `onMouseEnter` and `onMouseLeave` in UI components like `SpeedControl.js` to manage hover effects triggers unnecessary re-renders of the component.
**Action:** Replace state-based hover with CSS pseudo-classes or Tailwind's `hover:` utility class (e.g. `hover:border-blue-400/70 hover:bg-blue-500/10`) to improve rendering performance and avoid needless reconciliation cycles.
