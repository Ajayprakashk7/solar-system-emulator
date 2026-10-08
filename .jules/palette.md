## 2024-10-08 - Missing Accessible Names on Responsive UI Overlays
**Learning:** In Tailwind CSS, hiding text via responsive utility classes (like hidden sm:inline) entirely removes the accessible name for screen readers on affected viewports if the remaining content is just an icon. Also, custom 3D UI overlays need explicit focus-visible states.
**Action:** Always verify that elements hiding text responsively are accompanied by an explicit aria-label on the parent container, and add explicit focus-visible utility classes to custom styled UI overlays.
