## 2025-05-18 - Improve UI Accessibility and Mobile Layout
**Learning:** Many custom `motion.button` and `motion.div` UI components lacked keyboard focus indicators (`focus-visible`), reducing accessibility. Also, `SpeedControl.js` overlapped with `ControlMenu.js` on mobile devices.
**Action:** Applied Tailwind `focus-visible` utilities to interactive elements and repositioned `SpeedControl.js` to `bottom-24` on mobile to ensure clear touch targets.
