## 2026-08-25 - Mobile Control Overlap & Accessibility
**Learning:** Floating UI controls positioned identically (e.g. `top-4 right-4`) overlap on mobile devices, and interactive framer-motion elements often lack keyboard focus indicators.
**Action:** Position auxiliary controls like SpeedControl near the bottom (e.g. `bottom-24`) on mobile, and consistently apply Tailwind `focus-visible` utility classes with `aria-label`s for accessibility.
