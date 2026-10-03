## 2024-05-18 - Avoid state-based hover for React performance
**Learning:** Using React state (`isHovering` with `useState`) combined with `onMouseEnter` and `onMouseLeave` triggers unnecessary re-renders of the component.
**Action:** Replace state-based hover logic with native CSS or Tailwind hover pseudo-classes (e.g., `hover:bg-blue-500/10`) whenever possible, especially for UI components.
