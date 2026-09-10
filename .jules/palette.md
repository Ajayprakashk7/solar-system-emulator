## 2024-05-18 - Fix focus outline breaking circular buttons
**Learning:** Global CSS sets a 4px border-radius on `focus-visible`, which breaks the focus outlines for custom circular interactive elements (e.g., `<motion.div role="button">` styled with `rounded-full`).
**Action:** Always apply explicit Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to override this global style and maintain the intended circular shape on elements with `rounded-full`.
