## 2025-02-23 - Mobile Control Overlap & Missing Keyboard Focus
**Learning:** Found a pattern where floating UI controls (like `SpeedControl`) positioned at `top-4 right-4` overlap with other UI components on mobile screens. Additionally, `framer-motion` buttons frequently lack keyboard accessibility `focus-visible` styles.
**Action:** Relocated auxiliary controls to `bottom-24 right-4` to clear the mobile touch zone, and systematically applied `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black` to interactive elements.
