## 2025-02-18 - Missing ARIA Controls on Disclosure Button
**Learning:** In React implementations of disclosure patterns, using aria-expanded is not sufficient for assistive technologies; the toggle button must explicitly link to its expandable container via aria-controls.
**Action:** Always pair aria-expanded on a button with aria-controls="[id]", and ensure the target expandable container has the matching id="[id]" attribute.
