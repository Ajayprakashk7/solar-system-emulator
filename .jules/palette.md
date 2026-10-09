## 2024-10-09 - Accessible responsive UI hiding
**Learning:** Hiding text via Tailwind `hidden sm:inline` removes the accessible name for screen readers on small viewports when applied to labels alongside icons inside buttons.
**Action:** When hiding text classes visually, always add `aria-label` to the parent interactive element and apply `aria-hidden="true"` on decorative icons inside it.
