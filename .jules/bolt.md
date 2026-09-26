## 2024-05-24 - Avoid useState for CSS hover
**Learning:** Using React state variables like `isHovering` combined with `onMouseEnter` and `onMouseLeave` triggers unnecessary React re-renders on the main thread just to manage a visual hover state.
**Action:** Always prefer native CSS pseudo-classes or Tailwind hover modifiers (e.g., `hover:bg-blue-500/10`) to handle hover styles, offloading the work to the browser's style engine and preventing component re-renders.
