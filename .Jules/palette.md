## 2024-03-24 - Accessibility improvements for loading skeletons
**Learning:** Screen readers might announce loading skeletons with meaningless shapes if they aren't hidden from assistive tech. Adding `aria-hidden="true"` to decorative/purely visual loading elements improves the a11y experience.
**Action:** Always add `aria-hidden="true"` to structural loading components like `PlanetDetailSkeleton`, `PlanetMenuSkeleton`, and `ImagePlaceholder` which only contain CSS shapes and no semantic text for a screen reader.
