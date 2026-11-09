## 2024-05-18 - Skeleton Accessibility Improvements
**Learning:** Loading skeleton components should use aria-hidden="true" because they represent decorative structural placeholders which convey no meaningful semantic content to screen readers.
**Action:** Always add aria-hidden="true" to components like PlanetDetailSkeleton, PlanetMenuSkeleton, and ImagePlaceholder so screen readers ignore meaningless visual loading effects.
