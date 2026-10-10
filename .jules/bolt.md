## 2024-05-15 - React Hover State Optimization
**Learning:** Using state variables (`isHovering`) coupled with `onMouseEnter`/`onMouseLeave` triggers unnecessary component re-renders just for visual hover effects.
**Action:** Replace React state-based hover logic with native Tailwind CSS pseudo-classes (e.g., `hover:bg-blue-500/10 hover:border-blue-400/70`) wherever possible to offload the work to the browser's CSS engine.
