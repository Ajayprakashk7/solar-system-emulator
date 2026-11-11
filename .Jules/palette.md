## 2024-05-24 - Hide Decorative Loading States from Screen Readers
**Learning:** Screen readers announce visual loading skeletons (like animate-pulse divs and shimmer effects) if they aren't hidden, which creates noise without providing meaning since they are purely decorative visual cues.
**Action:** Always apply `aria-hidden="true"` to decorative loading skeletons and shimmer effects (like `PlanetDetailSkeleton`, `PlanetMenuSkeleton`, and `ImagePlaceholder`) to prevent meaningless announcements.
