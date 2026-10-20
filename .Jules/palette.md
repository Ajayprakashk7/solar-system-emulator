## 2024-05-18 - Accessible Disclosure Patterns
**Learning:** In the PlanetDetail component, the expandable moons list uses aria-expanded but lacks the programmatic association to the expandable container.
**Action:** Always pair aria-expanded on a disclosure toggle button with aria-controls="[id]", and ensure the target expandable container has the matching id="[id]" attribute to ensure screen readers can associate the toggle with its content.
