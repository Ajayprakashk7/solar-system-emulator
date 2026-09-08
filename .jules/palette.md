## 2024-05-18 - Fix custom circular interactive elements focus outlines
**Learning:** In this repository, global CSS sets a 4px border-radius on `focus-visible`, breaking the focus outlines for custom circular interactive elements (e.g., `<motion.div role="button">` styled with `rounded-full`).
**Action:** Always apply explicit Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) to override this global style and maintain the intended circular shape.
