## 2024-05-20 - Global Focus Radius Breaks Circular Buttons
**Learning:** The app's global CSS sets a 4px border-radius on focus-visible, which breaks the focus outline shape for custom circular interactive elements (like <motion.div role="button"> styled with rounded-full).
**Action:** Always apply explicit Tailwind focus utility classes including focus-visible:rounded-full (e.g., focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full) to circular elements to override this global style.
