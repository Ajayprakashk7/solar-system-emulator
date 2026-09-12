## 2024-09-12 - Fix Circular Element Focus Outlines
**Learning:** The global CSS applies a 4px border-radius on `*:focus-visible`, which breaks the focus outlines for custom circular interactive elements (e.g., `<motion.div role="button">` styled with `rounded-full`), making them look square instead of circular.
**Action:** Always apply explicit Tailwind focus utility classes including `focus-visible:rounded-full` (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to override this global style and maintain the intended circular shape on interactive elements.
