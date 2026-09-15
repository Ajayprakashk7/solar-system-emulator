## 2024-09-15 - Global Focus Rings on Rounded Elements
**Learning:** The app's global CSS sets a `4px` border-radius on `focus-visible`, breaking the focus outlines for custom circular interactive elements (e.g., rounded-full buttons).
**Action:** Always apply explicit Tailwind focus utility classes including `focus-visible:rounded-full` (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-full`) to override this global style and maintain the intended circular shape.
