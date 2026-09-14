## 2025-02-23 - Fix Circular Focus Indicators
**Learning:** The global CSS applies a 4px border-radius to all `focus-visible` states, which breaks the focus outline shape for circular interactive elements like `rounded-full` buttons.
**Action:** Explicitly add `focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded-full` utility classes to circular elements to override the global styles and maintain the intended shape.
