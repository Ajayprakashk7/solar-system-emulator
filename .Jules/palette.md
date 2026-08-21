## 2024-05-20 - Mobile UI Control Overlap & Accessibility
**Learning:** Floating UI controls at `top-4 right-4` overlap on mobile devices, and interactive `motion.button` elements frequently lack keyboard focus indicators.
**Action:** Always position auxiliary controls near the bottom (e.g., `bottom-24 right-4`) on mobile, and consistently apply Tailwind `focus-visible` utilities to ensure clear touch targets and keyboard accessibility.
