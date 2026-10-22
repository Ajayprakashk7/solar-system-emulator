## 2024-10-23 - Explicit Programmatic Associations for Disclosures
**Learning:** In the solar-system-emulator's PlanetDetail component, disclosure elements (like the moons list) were using aria-expanded without explicitly connecting the button to its target content, making it difficult for assistive technology users to know what content was being toggled.
**Action:** Always pair aria-expanded on a disclosure toggle button with aria-controls="[id]", and ensure the target expandable container has the matching id="[id]" attribute.
