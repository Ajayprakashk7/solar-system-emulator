## 2024-10-15 - [Explicit Focus Indicators for 3D UI Overlays]
**Learning:** Custom styled interactive UI overlay components in dark-mode 3D contexts often lack native focus indicators, making keyboard navigation difficult to track visually.
**Action:** Always add explicit, high-contrast Tailwind `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-blue-400`) to these elements to ensure clear focus states for keyboard users.
