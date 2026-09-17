## $(date +%Y-%m-%d) - Fix Focus Outlines on Circular Interactive Elements
**Learning:** Global CSS defining a 4px border-radius on `focus-visible` breaks the focus outlines for custom circular interactive elements (e.g., `<motion.div role="button">` styled with `rounded-full`).
**Action:** Always apply explicit Tailwind focus utility classes including `focus-visible:rounded-full` (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to override this global style and maintain the intended circular shape.
