## 2025-02-18 - High Contrast Focus Styles in 3D Environments
**Learning:** Custom styled interactive UI overlay components in dark-mode 3D contexts (like the solar system emulator) often lack native focus indicators, making keyboard navigation inaccessible. Users navigating via keyboard cannot see which planet they have selected.
**Action:** Always add explicit, high-contrast `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:outline-none`) to interactive elements overlays to ensure clear focus states for keyboard users.
