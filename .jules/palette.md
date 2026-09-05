## 2024-05-20 - Circular Focus Ring Regression
**Learning:** The global CSS reset `*:focus-visible { border-radius: 4px; }` unintentionally overrides the `border-radius` of custom `rounded-full` interactive elements, causing a jarring square focus ring on circular UI controls.
**Action:** Always explicitly apply Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) directly on circular interactive elements (like `<motion.div role="button">` or `<motion.button>`) to override global styles and maintain the intended circular shape during keyboard navigation.
