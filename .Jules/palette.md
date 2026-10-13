## 2024-10-13 - Focus ring on custom close buttons
**Learning:** Dismiss buttons on custom overlay components frequently remove the default outline using focus-visible:outline-none but fail to add a custom focus ring, which makes keyboard navigation difficult.
**Action:** Always ensure that when removing default outlines, a high-contrast Tailwind focus-visible:ring-2 utility is added to maintain accessibility.
