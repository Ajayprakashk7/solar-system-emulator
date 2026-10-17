## 2024-05-24 - Missing id association for disclosure components
**Learning:** Disclosure patterns using `aria-expanded` require explicit programmatic association to the content they control using `aria-controls` matching the target's `id`. Without this, screen reader users only know a section expands, not what content dynamically appears.
**Action:** Always pair `aria-expanded` with `aria-controls="[id]"` and set `id="[id]"` on the conditionally rendered container.
