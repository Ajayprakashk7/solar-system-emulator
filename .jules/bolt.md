## 2024-05-20 - Removed unnecessary React state for CSS hover
**Learning:** React state changes for hover effects (`isHovering`) cause unnecessary re-renders in UI components.
**Action:** Use native CSS/Tailwind hover states (`hover:bg-blue-500/10`) instead of React `onMouseEnter`/`onMouseLeave` state toggles whenever possible.
