## 2024-10-26 - Broken Focus Rings on Rounded-Full Elements
**Learning:** The project's global CSS sets a 4px border-radius on focus-visible, which overrides and breaks the focus outlines for custom circular interactive elements (styled with rounded-full).
**Action:** Always apply explicit Tailwind focus utility classes (focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full) to circular buttons to override the global style and maintain the intended shape.
