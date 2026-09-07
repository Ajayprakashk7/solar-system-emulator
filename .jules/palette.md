## 2024-05-23 - Focus Styles on Circular Elements
**Learning:** The global `*:focus-visible` rule in `globals.css` applies a 4px border-radius, which breaks the circular shape of custom elements styled with `rounded-full` during keyboard navigation.
**Action:** Always explicitly apply Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) to `rounded-full` interactive elements to override this global style and maintain their intended circular shape while ensuring accessibility.
