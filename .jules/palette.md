## YYYY-MM-DD - Replaced JS hover with CSS for Performance
**Learning:** Binding state variables like isHovering to onMouseEnter and onMouseLeave in React causes unnecessary re-renders when styling hover states.
**Action:** Always prefer native CSS pseudo-classes or Tailwind utilities (e.g., hover:bg-blue-500/10) for visual hover states instead of managing them in JS state.
