## 2024-05-24 - Floating Control Overlaps & Keyboard Focus
**Learning:** In this repository, floating UI controls positioned at top-4 right-4 often overlap with ControlMenu.js and ExitButton.js on mobile devices. There is also a recurring pattern of interactive elements lacking keyboard focus indicators.
**Action:** Position auxiliary controls like SpeedControl.js near the bottom (e.g., bottom-24 right-4) to ensure clear touch targets. Apply Tailwind focus-visible utility classes to interactive elements, and include aria-labels for visually hidden text buttons.
