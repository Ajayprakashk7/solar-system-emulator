## 2026-08-18 - Address missing keyboard focus states and mobile overlap
**Learning:** Keyboard focus indicators (using focus-visible utility classes) are consistently missing across custom UI controls, and fixed-position top-right auxiliary controls frequently overlap with primary elements (like menus) on mobile devices.
**Action:** Applied Tailwind focus-visible classes to all interactive elements to ensure accessibility for keyboard navigation, and established a pattern to position auxiliary controls near the bottom for clear mobile touch targets.
