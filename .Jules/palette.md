## 2024-10-12 - Accessible interactive buttons overlaid on canvas
**Learning:** Tailwind responsive hiding classes like hidden sm:inline entirely remove the accessible name for screen readers on mobile if the remaining content is just a decorative icon. Furthermore, interactive components overlaid on a 3D context lack focus indicators.
**Action:** Always add an explicit aria-label and high-contrast focus-visible utility classes to interactive canvas overlays, and apply aria-hidden="true" to the decorative icon to prevent redundant or missing announcements.
