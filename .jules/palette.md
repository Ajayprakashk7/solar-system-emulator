## 2024-05-15 - Optimize hover state and fix focus ring on interactive circular elements
**Learning:** React state-driven hover effects (using onMouseEnter/Leave) cause unnecessary re-renders. Global focus-visible styles also break circular focus outlines.
**Action:** Use native Tailwind pseudo-classes (e.g. hover:) and explicit focus-visible utility classes (e.g. focus-visible:rounded-full) for interactive elements to improve performance and accessibility.
