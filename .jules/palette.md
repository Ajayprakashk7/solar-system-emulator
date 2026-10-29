## 2025-03-08 - Accessible Disclosure Patterns
**Learning:** Disclosure widgets (like expandable moon lists) need explicit programmatic associations for screen readers. Just using aria-expanded is not enough; without aria-controls and a matching target id, assistive tech cannot easily locate or associate the revealed content.
**Action:** Always pair aria-expanded with aria-controls="[id]" and set the corresponding id="[id]" on the expandable container.
