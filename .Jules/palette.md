## 2024-05-24 - PlanetDetail Disclosure Accessibility
**Learning:** In the solar-system-emulator's PlanetDetail panel, interactive disclosure widgets for satellite systems lacked explicit DOM linkage, causing screen readers to silently fail when announcing expandable content states.
**Action:** Always pair aria-expanded with an explicit aria-controls attribute targeting the corresponding expandable container's id.
