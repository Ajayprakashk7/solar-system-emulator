## 2024-10-01 - Missing ARIA label for Mobile Instructions Close Button
**Learning:** The mobile instructions modal has a close button `✕` without an `aria-label`, making it inaccessible for screen readers to understand its purpose. This is a common pattern for dismissible overlay components.
**Action:** Add an `aria-label="Close instructions"` to the dismiss button in `MobileInstructions.js`.
