## 2024-05-15 - Global CSS focus breaking circular element outlines
**Learning:** The project's global CSS sets a 4px border-radius on `focus-visible`, which breaks the focus outline shape for circular interactive UI elements (like round buttons or `motion.div` acting as buttons with `rounded-full`).
**Action:** Always explicitly apply Tailwind focus utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full`) to custom circular interactive elements to override the global style and maintain the intended circular shape during keyboard navigation.
