## 2024-05-24 - Accessible Overlay Buttons
**Learning:** Tailwind responsive hiding classes (`hidden sm:inline`) remove text accessibility for screen readers on mobile. Overlay buttons in 3D canvas also lack native focus indicators.
**Action:** Always add explicit `aria-label` to buttons with conditionally hidden text, `aria-hidden="true"` to decorative icons, and explicit `focus-visible` ring classes to interactive canvas overlays.
