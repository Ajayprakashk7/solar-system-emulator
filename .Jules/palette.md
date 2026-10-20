## YYYY-MM-DD - [Disclosure Pattern Accessibility]
**Learning:** [When creating disclosure patterns (like expandable lists), users of assistive technologies rely on explicit programmatic associations.]
**Action:** [Always pair `aria-expanded` on a disclosure toggle button with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.]
