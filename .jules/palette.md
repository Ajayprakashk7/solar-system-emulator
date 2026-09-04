## 2024-09-04 - Fix Custom Circular Focus Indicator
**Learning:** Global CSS in this repo (`*:focus-visible { border-radius: 4px }`) overrides specific Tailwind classes like `rounded-full` during keyboard navigation, breaking the circular focus state of custom interactive elements (e.g., `<motion.div role="button">`).
**Action:** Always apply explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color]` utility classes to custom interactive elements to override the global style and maintain the intended shape.
