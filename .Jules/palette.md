## 2024-03-24 - Floating UI Focus Indicators
**Learning:** Custom floating UI components (buttons/controls) frequently lack keyboard focus indicators, making them inaccessible to keyboard users, and auxiliary controls positioned at the top right often overlap with core exit menus on mobile devices.
**Action:** Always apply `focus-visible:outline-none focus-visible:ring-2` utility classes to interactive elements like `<motion.button>`, ensure icon-only variants have `aria-label`s, and position non-critical mobile controls (like speed) near the bottom to avoid overlapping top menus.
