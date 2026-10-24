## 2024-05-24 - Accessibility for Disclosure Patterns
**Learning:** When creating disclosure patterns (like expandable lists for planet moons), users of assistive technologies rely on explicit programmatic associations. Using `aria-expanded` alone is insufficient if it doesn't point to the content it controls.
**Action:** Always pair `aria-expanded` on a disclosure toggle button with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.
