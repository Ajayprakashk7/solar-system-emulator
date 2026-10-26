## 2024-10-26 - Add aria-controls for expandable list
**Learning:** Disclosure patterns in UI require explicit programmatic association between the toggle button and the expandable container.
**Action:** When implementing an expandable list with `aria-expanded`, always pair it with an `aria-controls` attribute pointing to the ID of the container being expanded, so assistive technologies can announce the relationship.
