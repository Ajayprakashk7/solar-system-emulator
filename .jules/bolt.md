## 2024-05-18 - Avoid state variables for hover styles
**Learning:** Using React state variables (`useState` and `onMouseEnter`/`onMouseLeave`) to manage hover effects triggers unnecessary re-renders of the component. This is especially harmful in performance-sensitive components (like UI overlays over a 3D canvas).
**Action:** Replace state-based hover logic with native CSS or Tailwind hover pseudo-classes (e.g., `hover:bg-blue-500/10`) whenever possible.
