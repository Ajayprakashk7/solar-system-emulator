## 2026-11-02 - ARIA Controls for Disclosure Patterns
**Learning:** Using `aria-expanded` alone is insufficient for assistive technologies to locate the revealed content in disclosure patterns (like expandable UI lists).
**Action:** Always pair the toggle button's `aria-expanded` attribute with `aria-controls="[id]"` and ensure the target expandable container has the matching `id="[id]"`.
