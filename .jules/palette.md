## 2024-05-24 - Fix broken focus rings on circular buttons
**Learning:** The global CSS `*:focus-visible` rule (which sets a 4px border-radius) breaks focus outlines on circular interactive elements (e.g., `<motion.div role="button">` or `<motion.button>` styled with `rounded-full`).
**Action:** Always apply explicit Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`) to override this global style and maintain the intended circular shape on circular buttons.
