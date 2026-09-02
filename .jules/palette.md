## 2024-05-19 - Fix circular focus rings broken by global CSS
**Learning:** The global CSS sets a 4px border-radius on `*:focus-visible`, which breaks the focus outlines for custom circular interactive elements (e.g., `<motion.div role="button">` styled with `rounded-full`), making them look square.
**Action:** Always apply explicit Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) to circular buttons to override this global style and maintain the intended shape.
