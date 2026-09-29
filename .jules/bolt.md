## 2024-09-29 - Optimize React Re-renders by Removing state-based Hover Effects
**Learning:** Using React state variables (like `isHovering`) with `onMouseEnter` and `onMouseLeave` to manage UI hover effects causes unnecessary component re-renders, wasting main thread execution time. In UI performance tuning for this codebase, avoiding state updates for pure visual styling is critical.
**Action:** Always prefer native CSS pseudo-classes or Tailwind hover classes (e.g., `hover:bg-blue-500/10`) instead of JS-based state for managing hover styling.
