## 2025-05-23 - Missing aria-controls in disclosure patterns
**Learning:** The app uses disclosure patterns (e.g., expandable moon lists) with `aria-expanded` but fails to provide explicit programmatic associations to the expanded content, causing screen readers to lose context.
**Action:** Always pair `aria-expanded` on disclosure toggles with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.
