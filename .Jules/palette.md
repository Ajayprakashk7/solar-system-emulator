## 2024-10-31 - Accessible Disclosure Pattern
**Learning:** Using aria-expanded alone is insufficient for assistive technologies. We must pair it with aria-controls referencing the target container's id.
**Action:** Always check that toggle buttons with aria-expanded have a matching aria-controls that targets the revealed content's id.
