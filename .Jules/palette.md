## 2024-10-25 - Disclosure Pattern Accessibility
**Learning:** Disclosure patterns in React (like the notable moons list in `PlanetDetail.js`) often miss programmatic associations between the toggle button and the content container, confusing screen reader users.
**Action:** Always pair `aria-expanded` on a disclosure button with an explicit `aria-controls="[id]"` attribute that matches the `id` of the expanded container.
