## 2024-10-24 - Fix Mobile Controls Overlap and Keyboard Accessibility
**Learning:** Floating UI controls at `top-4 right-4` conflict with `ControlMenu.js` on mobile devices. Custom interactive elements (`role="button"`) lack native keyboard focus rings, reducing accessibility for keyboard users.
**Action:** Position auxiliary controls (like `SpeedControl.js`) at `bottom-24 right-4` on mobile, explicitly resetting `sm:bottom-auto` to avoid layout regressions. Always apply `focus-visible` utility classes to custom interactive elements.
