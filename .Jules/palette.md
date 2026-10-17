## 2024-10-17 - PlanetDetail Moons Disclosure Accessibility
**Learning:** The "Notable moons" button uses `aria-expanded` but lacks `aria-controls` targeting the expanded section's `id`, breaking programmatic association for screen readers.
**Action:** Always pair `aria-expanded` on a disclosure toggle button with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.
