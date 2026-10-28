## 2024-05-18 - Explicit programmatic associations for disclosure patterns
**Learning:** When building disclosure patterns (like expandable lists), assistive technology relies on explicit programmatic associations. Without pairing `aria-expanded` on the toggle button with `aria-controls="[id]"` on the target container, the connection between the toggle and the content is strictly visual and sequential.
**Action:** Always pair `aria-expanded` on a disclosure button with `aria-controls="[id]"`, and ensure the target expandable container has the matching `id="[id]"` attribute.
