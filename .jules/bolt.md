## 2024-05-24 - React Hover State Anti-pattern
**Learning:** Found instances where hover effects were managed using React state (`isHovering`) and `onMouseEnter`/`onMouseLeave` instead of native CSS. This causes unnecessary main-thread JavaScript execution and component re-renders for purely visual changes.
**Action:** Always prefer native CSS or Tailwind hover pseudo-classes (e.g., `hover:bg-blue-500/10`) over React state variables to manage hover effects, preventing unnecessary re-renders.
