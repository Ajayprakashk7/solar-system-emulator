## 2024-10-27 - [Add proper ARIA associations for disclosure widget]
**Learning:** [When creating disclosure patterns (like expandable lists), users of assistive technologies rely on explicit programmatic associations. Always pair `aria-expanded` on a disclosure toggle button with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.]
**Action:** [I will always explicitly associate disclosure toggle buttons with their target containers using `aria-controls` and `id` to ensure proper accessibility for screen reader users.]
