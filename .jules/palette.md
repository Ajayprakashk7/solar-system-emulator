## 2023-10-24 - SpeedControl Mobile Overlap and Keyboard Focus
**Learning:** Floating auxiliary controls (like SpeedControl) positioned at `top-4 right-4` overlap with primary interaction menus on mobile, creating poor touch targets. Furthermore, custom `div` buttons lack native keyboard focus indicators.
**Action:** Position auxiliary controls at the bottom (`bottom-24 right-4 top-auto`) on mobile, resetting top/bottom on larger screens (`sm:bottom-auto sm:top-6`). Always apply explicit `focus-visible` Tailwind utilities to custom interactive elements.
