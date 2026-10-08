## 2024-05-17 - Prevent unnecessary re-renders in SpeedControl
**Learning:** Using React state (onMouseEnter/onMouseLeave) for purely visual hover effects causes unnecessary re-renders when the same effect can be achieved with CSS.
**Action:** Always prefer native CSS or Tailwind hover pseudo-classes (e.g., hover:bg-blue-500/10) over JS state for hover styles.
