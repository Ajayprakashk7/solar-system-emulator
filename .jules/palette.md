## 2023-10-27 - [Responsive Text and Accessible Names]
**Learning:** Using responsive display classes (like hidden sm:inline) on button text inadvertently creates icon-only buttons on smaller screens, leaving mobile screen readers with no accessible name and reading out symbols (like '←').
**Action:** Always provide an explicit aria-label on buttons where the descriptive text is visually hidden at certain breakpoints to ensure consistent screen reader support across all devices.
